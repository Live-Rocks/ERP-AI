import { randomUUID } from "node:crypto";
import type { Alert, AlertSeverity, FactoryOverview, LineDataProvider, LineState, PendingWorkOrder, ProductionLine, WorkOrderHistoryEntry } from "@/domain/factory";
import { recordActivity } from "@/server/activity-log";

const definitions = [
  { id: "line-01", name: "產線 01｜組裝" },
  { id: "line-02", name: "產線 02｜加工" },
  { id: "line-03", name: "產線 03｜檢測" },
  { id: "line-04", name: "產線 04｜包裝" },
  { id: "line-05", name: "產線 05｜出貨" }
] as const;

export class FactoryStore {
  private readonly alerts: Alert[] = [];
  private readonly pendingWorkOrders: PendingWorkOrder[] = [];
  private readonly history = new Map<string, WorkOrderHistoryEntry[]>();

  createOrGetOpenAlert(lineId: string, code: string, title: string, severity: AlertSeverity, openedAt: string): Alert {
    const existing = this.alerts.find((alert) => alert.lineId === lineId && alert.code === code && !alert.resolvedAt);
    if (existing) return existing;
    const alert: Alert = { id: randomUUID(), lineId, code, title, severity, openedAt, resolvedAt: null };
    this.alerts.unshift(alert);
    recordActivity({ actorUserId: null, action: "alert.created", entityType: "alert", entityId: alert.id });
    const workOrder = { id: `WO-${alert.id.slice(0, 8).toUpperCase()}`, alertId: alert.id, lineId, status: "pending_assignment" as const, assignedToUserId: null, resolution: null, createdAt: openedAt };
    this.pendingWorkOrders.unshift(workOrder);
    this.history.set(workOrder.id, [{ at: openedAt, actorUserId: "system", status: "pending_assignment", note: "由異常告警建立待指派工單" }]);
    return alert;
  }

  openAlerts(): Alert[] {
    return this.alerts.filter((alert) => !alert.resolvedAt).map((alert) => ({ ...alert }));
  }

  workOrders(): PendingWorkOrder[] {
    return this.pendingWorkOrders.map((workOrder) => ({ ...workOrder }));
  }

  assignWorkOrder(id: string, technicianUserId: string, actorUserId: string, at = new Date().toISOString()): PendingWorkOrder | null {
    const workOrder = this.pendingWorkOrders.find((item) => item.id === id);
    if (!workOrder || workOrder.status !== "pending_assignment") return null;
    workOrder.assignedToUserId = technicianUserId; workOrder.status = "in_progress";
    recordActivity({ actorUserId, action: "work_order.assigned", entityType: "work_order", entityId: id });
    this.addHistory(id, { at, actorUserId, status: "in_progress", note: "管理員已指派技術員" }); return { ...workOrder };
  }

  resolveWorkOrder(id: string, technicianUserId: string, resolution: string, at = new Date().toISOString()): PendingWorkOrder | null {
    const workOrder = this.pendingWorkOrders.find((item) => item.id === id);
    if (!workOrder || workOrder.status !== "in_progress" || workOrder.assignedToUserId !== technicianUserId || !resolution.trim()) return null;
    workOrder.status = "resolved"; workOrder.resolution = resolution.trim();
    recordActivity({ actorUserId: technicianUserId, action: "work_order.resolved", entityType: "work_order", entityId: id });
    this.addHistory(id, { at, actorUserId: technicianUserId, status: "resolved", note: workOrder.resolution }); return { ...workOrder };
  }

  historyFor(id: string): WorkOrderHistoryEntry[] { return (this.history.get(id) ?? []).map((entry) => ({ ...entry })); }
  historyByWorkOrder(): Record<string, WorkOrderHistoryEntry[]> { return Object.fromEntries(this.pendingWorkOrders.map((item) => [item.id, this.historyFor(item.id)])); }
  private addHistory(id: string, entry: WorkOrderHistoryEntry): void { this.history.set(id, [...(this.history.get(id) ?? []), entry]); }
}

export class SimulatedLineDataProvider implements LineDataProvider {
  constructor(private readonly store: FactoryStore) {}

  refresh(at = new Date()): FactoryOverview {
    const bucket = Math.floor(at.getTime() / 5000);
    const refreshedAt = new Date(bucket * 5000).toISOString();
    const lines = definitions.map((definition, index) => this.createLine(definition.id, definition.name, index, bucket, refreshedAt));
    const faultedLine = lines.find((line) => line.state === "fault");
    if (faultedLine) {
      this.store.createOrGetOpenAlert(faultedLine.id, "SIM-OVERTEMP", "模擬設備溫度異常", "critical", refreshedAt);
    }
    return { lines, alerts: this.store.openAlerts(), pendingWorkOrders: this.store.workOrders(), workOrderHistory: this.store.historyByWorkOrder(), refreshedAt };
  }

  private createLine(id: string, name: string, index: number, bucket: number, lastUpdatedAt: string): ProductionLine {
    const phase = (bucket + index) % 12;
    const state: LineState = index === 2 && bucket % 4 < 2 ? "fault" : phase === 10 ? "stopped" : phase === 8 ? "idle" : "running";
    return {
      id,
      name,
      state,
      producedUnits: 1200 + bucket * (32 + index * 3),
      rejectedUnits: Math.max(0, 4 + ((bucket + index * 2) % 9)),
      lastUpdatedAt
    };
  }
}

export function createFactoryStore(): { store: FactoryStore; provider: SimulatedLineDataProvider } {
  const store = new FactoryStore();
  return { store, provider: new SimulatedLineDataProvider(store) };
}

let factory = createFactoryStore();

export function getFactoryProvider(): SimulatedLineDataProvider {
  return factory.provider;
}

export function getFactoryStore(): FactoryStore { return factory.store; }

export function resetFactoryStoreForTests(): void {
  factory = createFactoryStore();
}
