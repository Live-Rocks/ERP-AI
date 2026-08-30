import { randomUUID } from "node:crypto";
import type { Alert, AlertSeverity, FactoryOverview, LineDataProvider, LineState, PendingWorkOrder, ProductionLine, WorkOrderHistoryEntry } from "@/domain/factory";
import { recordActivity } from "@/server/activity-log";
import { getDatabasePool, hasPostgresRuntime } from "@/server/database";

const definitions = [
  { id: "line-01", name: "產線 01｜組裝" }, { id: "line-02", name: "產線 02｜加工" }, { id: "line-03", name: "產線 03｜檢測" }, { id: "line-04", name: "產線 04｜包裝" }, { id: "line-05", name: "產線 05｜出貨" }
] as const;

export interface FactoryDataStore {
  createOrGetOpenAlert(lineId: string, code: string, title: string, severity: AlertSeverity, openedAt: string): Promise<Alert>;
  openAlerts(): Promise<Alert[]>;
  workOrders(): Promise<PendingWorkOrder[]>;
  assignWorkOrder(id: string, technicianUserId: string, actorUserId: string, at?: string): Promise<PendingWorkOrder | null>;
  resolveWorkOrder(id: string, technicianUserId: string, resolution: string, at?: string): Promise<PendingWorkOrder | null>;
  historyFor(id: string): Promise<WorkOrderHistoryEntry[]>;
  historyByWorkOrder(): Promise<Record<string, WorkOrderHistoryEntry[]>>;
  saveSnapshots(lines: ProductionLine[]): Promise<void>;
}

export class FactoryStore implements FactoryDataStore {
  private readonly alerts: Alert[] = [];
  private readonly pendingWorkOrders: PendingWorkOrder[] = [];
  private readonly history = new Map<string, WorkOrderHistoryEntry[]>();

  async createOrGetOpenAlert(lineId: string, code: string, title: string, severity: AlertSeverity, openedAt: string): Promise<Alert> {
    const existing = this.alerts.find((alert) => alert.lineId === lineId && alert.code === code && !alert.resolvedAt);
    if (existing) return { ...existing };
    const alert: Alert = { id: randomUUID(), lineId, code, title, severity, openedAt, resolvedAt: null };
    this.alerts.unshift(alert);
    const workOrder = { id: `WO-${alert.id.slice(0, 8).toUpperCase()}`, alertId: alert.id, lineId, status: "pending_assignment" as const, assignedToUserId: null, resolution: null, createdAt: openedAt };
    this.pendingWorkOrders.unshift(workOrder);
    this.history.set(workOrder.id, [{ at: openedAt, actorUserId: "system", status: "pending_assignment", note: "由異常告警建立待指派工單" }]);
    await recordActivity({ actorUserId: null, action: "alert.created", entityType: "alert", entityId: alert.id });
    return { ...alert };
  }
  async openAlerts(): Promise<Alert[]> { return this.alerts.filter((alert) => !alert.resolvedAt).map((alert) => ({ ...alert })); }
  async workOrders(): Promise<PendingWorkOrder[]> { return this.pendingWorkOrders.map((workOrder) => ({ ...workOrder })); }
  async assignWorkOrder(id: string, technicianUserId: string, actorUserId: string, at = new Date().toISOString()): Promise<PendingWorkOrder | null> {
    const workOrder = this.pendingWorkOrders.find((item) => item.id === id);
    if (!workOrder || workOrder.status !== "pending_assignment") return null;
    workOrder.assignedToUserId = technicianUserId; workOrder.status = "in_progress";
    this.addHistory(id, { at, actorUserId, status: "in_progress", note: "管理員已指派技術員" });
    await recordActivity({ actorUserId, action: "work_order.assigned", entityType: "work_order", entityId: id }); return { ...workOrder };
  }
  async resolveWorkOrder(id: string, technicianUserId: string, resolution: string, at = new Date().toISOString()): Promise<PendingWorkOrder | null> {
    const workOrder = this.pendingWorkOrders.find((item) => item.id === id);
    if (!workOrder || workOrder.status !== "in_progress" || workOrder.assignedToUserId !== technicianUserId || !resolution.trim()) return null;
    workOrder.status = "resolved"; workOrder.resolution = resolution.trim();
    this.addHistory(id, { at, actorUserId: technicianUserId, status: "resolved", note: workOrder.resolution });
    await recordActivity({ actorUserId: technicianUserId, action: "work_order.resolved", entityType: "work_order", entityId: id }); return { ...workOrder };
  }
  async historyFor(id: string): Promise<WorkOrderHistoryEntry[]> { return (this.history.get(id) ?? []).map((entry) => ({ ...entry })); }
  async historyByWorkOrder(): Promise<Record<string, WorkOrderHistoryEntry[]>> { return Object.fromEntries(await Promise.all(this.pendingWorkOrders.map(async (item) => [item.id, await this.historyFor(item.id)]))); }
  async saveSnapshots(_lines: ProductionLine[]): Promise<void> {}
  private addHistory(id: string, entry: WorkOrderHistoryEntry): void { this.history.set(id, [...(this.history.get(id) ?? []), entry]); }
}

type AlertRow = { id: string; line_id: string; code: string; title: string; severity: AlertSeverity; opened_at: Date | string; resolved_at: Date | string | null };
type WorkOrderRow = { id: string; alert_id: string; line_id: string; status: PendingWorkOrder["status"]; assigned_to_user_id: string | null; resolution: string | null; created_at: Date | string };
type HistoryRow = { occurred_at: Date | string; actor_user_id: string; status: PendingWorkOrder["status"]; note: string };
const toIso = (value: Date | string): string => new Date(value).toISOString();
const toAlert = (row: AlertRow): Alert => ({ id: row.id, lineId: row.line_id, code: row.code, title: row.title, severity: row.severity, openedAt: toIso(row.opened_at), resolvedAt: row.resolved_at ? toIso(row.resolved_at) : null });
const toWorkOrder = (row: WorkOrderRow): PendingWorkOrder => ({ id: row.id, alertId: row.alert_id, lineId: row.line_id, status: row.status, assignedToUserId: row.assigned_to_user_id, resolution: row.resolution, createdAt: toIso(row.created_at) });

export class PostgresFactoryStore implements FactoryDataStore {
  async createOrGetOpenAlert(lineId: string, code: string, title: string, severity: AlertSeverity, openedAt: string): Promise<Alert> {
    const client = await getDatabasePool().connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query<AlertRow>("INSERT INTO alerts (id, line_id, code, title, severity, opened_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (line_id, code) WHERE resolved_at IS NULL DO NOTHING RETURNING id, line_id, code, title, severity, opened_at, resolved_at", [randomUUID(), lineId, code, title, severity, openedAt]);
      let row = inserted.rows[0];
      if (row) {
        const id = `WO-${row.id.slice(0, 8).toUpperCase()}`;
        await client.query("INSERT INTO work_orders (id, alert_id, line_id, status, created_at) VALUES ($1, $2, $3, 'pending_assignment', $4)", [id, row.id, lineId, openedAt]);
        await client.query("INSERT INTO work_order_history (id, work_order_id, occurred_at, actor_user_id, status, note) VALUES ($1, $2, $3, 'system', 'pending_assignment', $4)", [randomUUID(), id, openedAt, "由異常告警建立待指派工單"]);
        await client.query("INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id) VALUES ($1, NULL, 'alert.created', 'alert', $2)", [randomUUID(), row.id]);
      } else {
        const existing = await client.query<AlertRow>("SELECT id, line_id, code, title, severity, opened_at, resolved_at FROM alerts WHERE line_id = $1 AND code = $2 AND resolved_at IS NULL", [lineId, code]); row = existing.rows[0];
      }
      await client.query("COMMIT");
      if (!row) throw new Error("Unable to create or read the open alert.");
      return toAlert(row);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  async openAlerts(): Promise<Alert[]> { const result = await getDatabasePool().query<AlertRow>("SELECT id, line_id, code, title, severity, opened_at, resolved_at FROM alerts WHERE resolved_at IS NULL ORDER BY opened_at DESC"); return result.rows.map(toAlert); }
  async workOrders(): Promise<PendingWorkOrder[]> { const result = await getDatabasePool().query<WorkOrderRow>("SELECT id, alert_id, line_id, status, assigned_to_user_id, resolution, created_at FROM work_orders ORDER BY created_at DESC"); return result.rows.map(toWorkOrder); }
  async assignWorkOrder(id: string, technicianUserId: string, actorUserId: string, at = new Date().toISOString()): Promise<PendingWorkOrder | null> {
    const client = await getDatabasePool().connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<WorkOrderRow>("UPDATE work_orders SET assigned_to_user_id = $1, status = 'in_progress' WHERE id = $2 AND status = 'pending_assignment' RETURNING id, alert_id, line_id, status, assigned_to_user_id, resolution, created_at", [technicianUserId, id]); const row = result.rows[0];
      if (!row) { await client.query("ROLLBACK"); return null; }
      await client.query("INSERT INTO work_order_history (id, work_order_id, occurred_at, actor_user_id, status, note) VALUES ($1, $2, $3, $4, 'in_progress', $5)", [randomUUID(), id, at, actorUserId, "管理員已指派技術員"]);
      await client.query("INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, 'work_order.assigned', 'work_order', $3)", [randomUUID(), actorUserId, id]);
      await client.query("COMMIT"); return toWorkOrder(row);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  async resolveWorkOrder(id: string, technicianUserId: string, resolution: string, at = new Date().toISOString()): Promise<PendingWorkOrder | null> {
    if (!resolution.trim()) return null;
    const client = await getDatabasePool().connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<WorkOrderRow>("UPDATE work_orders SET status = 'resolved', resolution = $1 WHERE id = $2 AND status = 'in_progress' AND assigned_to_user_id = $3 RETURNING id, alert_id, line_id, status, assigned_to_user_id, resolution, created_at", [resolution.trim(), id, technicianUserId]); const row = result.rows[0];
      if (!row) { await client.query("ROLLBACK"); return null; }
      await client.query("INSERT INTO work_order_history (id, work_order_id, occurred_at, actor_user_id, status, note) VALUES ($1, $2, $3, $4, 'resolved', $5)", [randomUUID(), id, at, technicianUserId, resolution.trim()]);
      await client.query("INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, 'work_order.resolved', 'work_order', $3)", [randomUUID(), technicianUserId, id]);
      await client.query("COMMIT"); return toWorkOrder(row);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  async historyFor(id: string): Promise<WorkOrderHistoryEntry[]> { const result = await getDatabasePool().query<HistoryRow>("SELECT occurred_at, actor_user_id, status, note FROM work_order_history WHERE work_order_id = $1 ORDER BY occurred_at", [id]); return result.rows.map((row: HistoryRow) => ({ at: toIso(row.occurred_at), actorUserId: row.actor_user_id, status: row.status, note: row.note })); }
  async historyByWorkOrder(): Promise<Record<string, WorkOrderHistoryEntry[]>> { const orders = await this.workOrders(); return Object.fromEntries(await Promise.all(orders.map(async (order) => [order.id, await this.historyFor(order.id)]))); }
  async saveSnapshots(lines: ProductionLine[]): Promise<void> { await Promise.all(lines.map((line) => getDatabasePool().query("INSERT INTO line_snapshots (line_id, line_name, state, produced_units, rejected_units, last_updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (line_id) DO UPDATE SET line_name = EXCLUDED.line_name, state = EXCLUDED.state, produced_units = EXCLUDED.produced_units, rejected_units = EXCLUDED.rejected_units, last_updated_at = EXCLUDED.last_updated_at", [line.id, line.name, line.state, line.producedUnits, line.rejectedUnits, line.lastUpdatedAt]))); }
}

export class SimulatedLineDataProvider implements LineDataProvider {
  constructor(private readonly store: FactoryDataStore) {}
  async refresh(at = new Date()): Promise<FactoryOverview> {
    const bucket = Math.floor(at.getTime() / 5000); const refreshedAt = new Date(bucket * 5000).toISOString();
    const lines = definitions.map((definition, index) => this.createLine(definition.id, definition.name, index, bucket, refreshedAt));
    await this.store.saveSnapshots(lines);
    const faultedLine = lines.find((line) => line.state === "fault");
    if (faultedLine) await this.store.createOrGetOpenAlert(faultedLine.id, "SIM-OVERTEMP", "模擬設備溫度異常", "critical", refreshedAt);
    return { lines, alerts: await this.store.openAlerts(), pendingWorkOrders: await this.store.workOrders(), workOrderHistory: await this.store.historyByWorkOrder(), refreshedAt };
  }
  private createLine(id: string, name: string, index: number, bucket: number, lastUpdatedAt: string): ProductionLine {
    const phase = (bucket + index) % 12; const state: LineState = index === 2 && bucket % 4 < 2 ? "fault" : phase === 10 ? "stopped" : phase === 8 ? "idle" : "running";
    return { id, name, state, producedUnits: 1200 + bucket * (32 + index * 3), rejectedUnits: Math.max(0, 4 + ((bucket + index * 2) % 9)), lastUpdatedAt };
  }
}

export function createFactoryStore(): { store: FactoryStore; provider: SimulatedLineDataProvider } { const store = new FactoryStore(); return { store, provider: new SimulatedLineDataProvider(store) }; }
function createRuntimeFactory(): { store: FactoryDataStore; provider: SimulatedLineDataProvider } { const store = hasPostgresRuntime() ? new PostgresFactoryStore() : new FactoryStore(); return { store, provider: new SimulatedLineDataProvider(store) }; }
let factory = createRuntimeFactory();
export function getFactoryProvider(): SimulatedLineDataProvider { return factory.provider; }
export function getFactoryStore(): FactoryDataStore { return factory.store; }
export function resetFactoryStoreForTests(): void { factory = createFactoryStore(); }
