import { randomUUID } from "node:crypto";
import type { ProductionTask, ProductionTaskHistoryEntry, ProductionTaskStatus } from "@/domain/execution";
import { isValidTaskTransition } from "@/domain/execution";
import { recordActivity } from "@/server/activity-log";
import { getDatabasePool, hasPostgresRuntime } from "@/server/database";

const fixedLineIds = new Set(["line-01", "line-02", "line-03", "line-04", "line-05"]);
export const isFixedLineId = (lineId: string): boolean => fixedLineIds.has(lineId);

export interface ProductionTaskStore {
  create(lineId: string, title: string, actorUserId: string, technicianUserId: string | null, at?: string): Promise<ProductionTask | null>;
  list(userId?: string, role?: "admin" | "technician"): Promise<ProductionTask[]>;
  historyFor(id: string): Promise<ProductionTaskHistoryEntry[]>;
  assign(id: string, technicianUserId: string, actorUserId: string, at?: string): Promise<ProductionTask | null>;
  report(id: string, technicianUserId: string, status: ProductionTaskStatus, goodUnits: number, rejectedUnits: number, downtimeReason: string | null, at?: string): Promise<ProductionTask | null>;
}

const validNumber = (value: number): boolean => Number.isInteger(value) && value >= 0;
const cleanTitle = (title: string): string => title.trim();
const cleanReason = (reason: string | null): string | null => reason?.trim() || null;

export class MemoryProductionTaskStore implements ProductionTaskStore {
  private readonly tasks: ProductionTask[] = [];
  private readonly history = new Map<string, ProductionTaskHistoryEntry[]>();

  async create(lineId: string, title: string, actorUserId: string, technicianUserId: string | null, at = new Date().toISOString()): Promise<ProductionTask | null> {
    const trimmed = cleanTitle(title);
    if (!isFixedLineId(lineId) || !trimmed) return null;
    const task: ProductionTask = { id: randomUUID(), lineId, title: trimmed, status: "planned", assignedToUserId: technicianUserId, goodUnits: 0, rejectedUnits: 0, downtimeReason: null, createdAt: at, updatedAt: at };
    this.tasks.unshift(task);
    this.addHistory(task.id, { id: randomUUID(), taskId: task.id, at, actorUserId, status: "planned", goodUnits: 0, rejectedUnits: 0, downtimeReason: null, note: "管理員建立人工現場作業" });
    await recordActivity({ actorUserId, action: "production_task.created", entityType: "production_task", entityId: task.id });
    if (technicianUserId) await recordActivity({ actorUserId, action: "production_task.assigned", entityType: "production_task", entityId: task.id });
    return { ...task };
  }
  async list(userId?: string, role?: "admin" | "technician"): Promise<ProductionTask[]> { return this.tasks.filter((task) => role !== "technician" || task.assignedToUserId === userId).map((task) => ({ ...task })); }
  async historyFor(id: string): Promise<ProductionTaskHistoryEntry[]> { return (this.history.get(id) ?? []).map((entry) => ({ ...entry })); }
  async assign(id: string, technicianUserId: string, actorUserId: string, at = new Date().toISOString()): Promise<ProductionTask | null> {
    const task = this.tasks.find((item) => item.id === id); if (!task || task.status === "completed") return null;
    task.assignedToUserId = technicianUserId; task.updatedAt = at;
    this.addHistory(id, { id: randomUUID(), taskId: id, at, actorUserId, status: task.status, goodUnits: 0, rejectedUnits: 0, downtimeReason: null, note: "管理員已指派技術員" });
    await recordActivity({ actorUserId, action: "production_task.assigned", entityType: "production_task", entityId: id }); return { ...task };
  }
  async report(id: string, technicianUserId: string, status: ProductionTaskStatus, goodUnits: number, rejectedUnits: number, downtimeReason: string | null, at = new Date().toISOString()): Promise<ProductionTask | null> {
    const task = this.tasks.find((item) => item.id === id);
    if (!task || task.assignedToUserId !== technicianUserId || !isValidTaskTransition(task.status, status) || !validNumber(goodUnits) || !validNumber(rejectedUnits)) return null;
    const reason = cleanReason(downtimeReason); if (status === "paused" && !reason) return null;
    task.status = status; task.goodUnits += goodUnits; task.rejectedUnits += rejectedUnits; task.downtimeReason = reason; task.updatedAt = at;
    this.addHistory(id, { id: randomUUID(), taskId: id, at, actorUserId: technicianUserId, status, goodUnits, rejectedUnits, downtimeReason: reason, note: `技術員回報作業狀態為 ${status}` });
    await recordActivity({ actorUserId: technicianUserId, action: "production_task.reported", entityType: "production_task", entityId: id }); return { ...task };
  }
  private addHistory(id: string, entry: ProductionTaskHistoryEntry): void { this.history.set(id, [...(this.history.get(id) ?? []), entry]); }
}

type TaskRow = { id: string; line_id: string; title: string; status: ProductionTaskStatus; assigned_to_user_id: string | null; good_units: number; rejected_units: number; downtime_reason: string | null; created_at: Date | string; updated_at: Date | string };
type TaskHistoryRow = { id: string; task_id: string; occurred_at: Date | string; actor_user_id: string; status: ProductionTaskStatus; good_units: number; rejected_units: number; downtime_reason: string | null; note: string };
const iso = (value: Date | string): string => new Date(value).toISOString();
const taskFromRow = (row: TaskRow): ProductionTask => ({ id: row.id, lineId: row.line_id, title: row.title, status: row.status, assignedToUserId: row.assigned_to_user_id, goodUnits: row.good_units, rejectedUnits: row.rejected_units, downtimeReason: row.downtime_reason, createdAt: iso(row.created_at), updatedAt: iso(row.updated_at) });
const historyFromRow = (row: TaskHistoryRow): ProductionTaskHistoryEntry => ({ id: row.id, taskId: row.task_id, at: iso(row.occurred_at), actorUserId: row.actor_user_id, status: row.status, goodUnits: row.good_units, rejectedUnits: row.rejected_units, downtimeReason: row.downtime_reason, note: row.note });

export class PostgresProductionTaskStore implements ProductionTaskStore {
  async create(lineId: string, title: string, actorUserId: string, technicianUserId: string | null, at = new Date().toISOString()): Promise<ProductionTask | null> {
    const trimmed = cleanTitle(title); if (!isFixedLineId(lineId) || !trimmed) return null;
    const client = await getDatabasePool().connect(); const id = randomUUID();
    try {
      await client.query("BEGIN");
      const result = await client.query<TaskRow>("INSERT INTO production_tasks (id, line_id, title, status, assigned_to_user_id, created_at, updated_at) VALUES ($1, $2, $3, 'planned', $4, $5, $5) RETURNING id, line_id, title, status, assigned_to_user_id, good_units, rejected_units, downtime_reason, created_at, updated_at", [id, lineId, trimmed, technicianUserId, at]); const row = result.rows[0]; if (!row) throw new Error("Unable to create production task.");
      await client.query("INSERT INTO production_task_history (id, task_id, occurred_at, actor_user_id, status, note) VALUES ($1, $2, $3, $4, 'planned', $5)", [randomUUID(), id, at, actorUserId, "管理員建立人工現場作業"]);
      await client.query("INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, 'production_task.created', 'production_task', $3)", [randomUUID(), actorUserId, id]);
      if (technicianUserId) await client.query("INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, 'production_task.assigned', 'production_task', $3)", [randomUUID(), actorUserId, id]);
      await client.query("COMMIT"); return taskFromRow(row);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  async list(userId?: string, role?: "admin" | "technician"): Promise<ProductionTask[]> {
    const result = role === "technician" ? await getDatabasePool().query<TaskRow>("SELECT id, line_id, title, status, assigned_to_user_id, good_units, rejected_units, downtime_reason, created_at, updated_at FROM production_tasks WHERE assigned_to_user_id = $1 ORDER BY updated_at DESC", [userId]) : await getDatabasePool().query<TaskRow>("SELECT id, line_id, title, status, assigned_to_user_id, good_units, rejected_units, downtime_reason, created_at, updated_at FROM production_tasks ORDER BY updated_at DESC");
    return result.rows.map(taskFromRow);
  }
  async historyFor(id: string): Promise<ProductionTaskHistoryEntry[]> { const result = await getDatabasePool().query<TaskHistoryRow>("SELECT id, task_id, occurred_at, actor_user_id, status, good_units, rejected_units, downtime_reason, note FROM production_task_history WHERE task_id = $1 ORDER BY occurred_at", [id]); return result.rows.map(historyFromRow); }
  async assign(id: string, technicianUserId: string, actorUserId: string, at = new Date().toISOString()): Promise<ProductionTask | null> {
    const client = await getDatabasePool().connect();
    try {
      await client.query("BEGIN"); const result = await client.query<TaskRow>("UPDATE production_tasks SET assigned_to_user_id = $1, updated_at = $2 WHERE id = $3 AND status != 'completed' RETURNING id, line_id, title, status, assigned_to_user_id, good_units, rejected_units, downtime_reason, created_at, updated_at", [technicianUserId, at, id]); const row = result.rows[0]; if (!row) { await client.query("ROLLBACK"); return null; }
      await client.query("INSERT INTO production_task_history (id, task_id, occurred_at, actor_user_id, status, note) VALUES ($1, $2, $3, $4, $5, $6)", [randomUUID(), id, at, actorUserId, row.status, "管理員已指派技術員"]);
      await client.query("INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, 'production_task.assigned', 'production_task', $3)", [randomUUID(), actorUserId, id]);
      await client.query("COMMIT"); return taskFromRow(row);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  async report(id: string, technicianUserId: string, status: ProductionTaskStatus, goodUnits: number, rejectedUnits: number, downtimeReason: string | null, at = new Date().toISOString()): Promise<ProductionTask | null> {
    const reason = cleanReason(downtimeReason); if (!validNumber(goodUnits) || !validNumber(rejectedUnits) || (status === "paused" && !reason)) return null;
    const client = await getDatabasePool().connect();
    try {
      await client.query("BEGIN"); const current = await client.query<TaskRow>("SELECT id, line_id, title, status, assigned_to_user_id, good_units, rejected_units, downtime_reason, created_at, updated_at FROM production_tasks WHERE id = $1 FOR UPDATE", [id]); const task = current.rows[0];
      if (!task || task.assigned_to_user_id !== technicianUserId || !isValidTaskTransition(task.status, status)) { await client.query("ROLLBACK"); return null; }
      const updated = await client.query<TaskRow>("UPDATE production_tasks SET status = $1, good_units = good_units + $2, rejected_units = rejected_units + $3, downtime_reason = $4, updated_at = $5 WHERE id = $6 RETURNING id, line_id, title, status, assigned_to_user_id, good_units, rejected_units, downtime_reason, created_at, updated_at", [status, goodUnits, rejectedUnits, reason, at, id]); const row = updated.rows[0]; if (!row) throw new Error("Unable to update production task.");
      await client.query("INSERT INTO production_task_history (id, task_id, occurred_at, actor_user_id, status, good_units, rejected_units, downtime_reason, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [randomUUID(), id, at, technicianUserId, status, goodUnits, rejectedUnits, reason, `技術員回報作業狀態為 ${status}`]);
      await client.query("INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, 'production_task.reported', 'production_task', $3)", [randomUUID(), technicianUserId, id]);
      await client.query("COMMIT"); return taskFromRow(row);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
}

let store: ProductionTaskStore = hasPostgresRuntime() ? new PostgresProductionTaskStore() : new MemoryProductionTaskStore();
export const getProductionTaskStore = (): ProductionTaskStore => store;
export const resetProductionTaskStoreForTests = (): void => { store = new MemoryProductionTaskStore(); };
