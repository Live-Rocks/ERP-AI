import { randomUUID } from "node:crypto";
import type { InspectionResult, QualityHistoryEntry, QualityRecord, QualityStatus } from "@/domain/quality";
import { isValidQualityTransition } from "@/domain/quality";
import { recordActivity } from "@/server/activity-log";
import { getDatabasePool, hasPostgresRuntime } from "@/server/database";

export interface QualityRecordStore {
  create(productionTaskId: string, lineId: string, batchOrSerial: string, inspectionResult: InspectionResult, defectDescription: string | null, actorUserId: string, at?: string): Promise<QualityRecord | null>;
  list(taskIds?: string[]): Promise<QualityRecord[]>;
  get(id: string): Promise<QualityRecord | null>;
  historyFor(id: string): Promise<QualityHistoryEntry[]>;
  correct(id: string, correctiveAction: string, actorUserId: string, at?: string): Promise<QualityRecord | null>;
  close(id: string, actorUserId: string, at?: string): Promise<QualityRecord | null>;
  trace(batchOrSerial: string): Promise<QualityRecord[]>;
}

const clean = (value: string | null): string | null => value?.trim() || null;
const validResult = (result: InspectionResult, defect: string | null): boolean => (result === "fail" && Boolean(defect)) || (result === "pass" && !defect);

export class MemoryQualityRecordStore implements QualityRecordStore {
  private readonly records: QualityRecord[] = [];
  private readonly history = new Map<string, QualityHistoryEntry[]>();

  async create(productionTaskId: string, lineId: string, batchOrSerial: string, inspectionResult: InspectionResult, defectDescription: string | null, actorUserId: string, at = new Date().toISOString()): Promise<QualityRecord | null> {
    const batch = clean(batchOrSerial); const defect = clean(defectDescription);
    if (!batch || !validResult(inspectionResult, defect) || this.records.some((record) => record.productionTaskId === productionTaskId && record.batchOrSerial === batch)) return null;
    const status: QualityStatus = inspectionResult === "pass" ? "closed" : "open";
    const record: QualityRecord = { id: randomUUID(), productionTaskId, lineId, batchOrSerial: batch, inspectionResult, defectDescription: defect, status, correctiveAction: null, createdAt: at, updatedAt: at };
    this.records.unshift(record); this.addHistory(record.id, { id: randomUUID(), qualityRecordId: record.id, at, actorUserId, status, note: inspectionResult === "pass" ? "管理員記錄檢驗合格" : "管理員建立不合格紀錄" });
    await recordActivity({ actorUserId, action: "quality_record.created", entityType: "quality_record", entityId: record.id });
    return { ...record };
  }
  async list(taskIds?: string[]): Promise<QualityRecord[]> { return this.records.filter((record) => !taskIds || taskIds.includes(record.productionTaskId)).map((record) => ({ ...record })); }
  async get(id: string): Promise<QualityRecord | null> { const record = this.records.find((item) => item.id === id); return record ? { ...record } : null; }
  async historyFor(id: string): Promise<QualityHistoryEntry[]> { return (this.history.get(id) ?? []).map((item) => ({ ...item })); }
  async correct(id: string, correctiveAction: string, actorUserId: string, at = new Date().toISOString()): Promise<QualityRecord | null> {
    const record = this.records.find((item) => item.id === id); const action = clean(correctiveAction);
    if (!record || !action || !isValidQualityTransition(record.status, "corrected")) return null;
    record.status = "corrected"; record.correctiveAction = action; record.updatedAt = at;
    this.addHistory(id, { id: randomUUID(), qualityRecordId: id, at, actorUserId, status: "corrected", note: "技術員已記錄矯正處置" });
    await recordActivity({ actorUserId, action: "quality_record.corrected", entityType: "quality_record", entityId: id }); return { ...record };
  }
  async close(id: string, actorUserId: string, at = new Date().toISOString()): Promise<QualityRecord | null> {
    const record = this.records.find((item) => item.id === id);
    if (!record || !isValidQualityTransition(record.status, "closed")) return null;
    record.status = "closed"; record.updatedAt = at;
    this.addHistory(id, { id: randomUUID(), qualityRecordId: id, at, actorUserId, status: "closed", note: "管理員已結案不合格紀錄" });
    await recordActivity({ actorUserId, action: "quality_record.closed", entityType: "quality_record", entityId: id }); return { ...record };
  }
  async trace(batchOrSerial: string): Promise<QualityRecord[]> { const batch = clean(batchOrSerial); return batch ? this.records.filter((record) => record.batchOrSerial === batch).map((record) => ({ ...record })) : []; }
  private addHistory(id: string, entry: QualityHistoryEntry): void { this.history.set(id, [...(this.history.get(id) ?? []), entry]); }
}

type QualityRow = { id: string; production_task_id: string; line_id: string; batch_or_serial: string; inspection_result: InspectionResult; defect_description: string | null; status: QualityStatus; corrective_action: string | null; created_at: Date | string; updated_at: Date | string };
type HistoryRow = { id: string; quality_record_id: string; occurred_at: Date | string; actor_user_id: string; status: QualityStatus; note: string };
const iso = (value: Date | string): string => new Date(value).toISOString();
const qualityFromRow = (row: QualityRow): QualityRecord => ({ id: row.id, productionTaskId: row.production_task_id, lineId: row.line_id, batchOrSerial: row.batch_or_serial, inspectionResult: row.inspection_result, defectDescription: row.defect_description, status: row.status, correctiveAction: row.corrective_action, createdAt: iso(row.created_at), updatedAt: iso(row.updated_at) });
const historyFromRow = (row: HistoryRow): QualityHistoryEntry => ({ id: row.id, qualityRecordId: row.quality_record_id, at: iso(row.occurred_at), actorUserId: row.actor_user_id, status: row.status, note: row.note });
const selectQuality = "id, production_task_id, line_id, batch_or_serial, inspection_result, defect_description, status, corrective_action, created_at, updated_at";

export class PostgresQualityRecordStore implements QualityRecordStore {
  async create(productionTaskId: string, lineId: string, batchOrSerial: string, inspectionResult: InspectionResult, defectDescription: string | null, actorUserId: string, at = new Date().toISOString()): Promise<QualityRecord | null> {
    const batch = clean(batchOrSerial); const defect = clean(defectDescription); if (!batch || !validResult(inspectionResult, defect)) return null;
    const client = await getDatabasePool().connect(); const id = randomUUID(); const status: QualityStatus = inspectionResult === "pass" ? "closed" : "open";
    try {
      await client.query("BEGIN");
      const result = await client.query<QualityRow>(`INSERT INTO quality_records (id, production_task_id, line_id, batch_or_serial, inspection_result, defect_description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING ${selectQuality}`, [id, productionTaskId, lineId, batch, inspectionResult, defect, status, at]); const row = result.rows[0]; if (!row) throw new Error("Unable to create quality record.");
      await client.query("INSERT INTO quality_record_history (id, quality_record_id, occurred_at, actor_user_id, status, note) VALUES ($1, $2, $3, $4, $5, $6)", [randomUUID(), id, at, actorUserId, status, inspectionResult === "pass" ? "管理員記錄檢驗合格" : "管理員建立不合格紀錄"]);
      await client.query("INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, 'quality_record.created', 'quality_record', $3)", [randomUUID(), actorUserId, id]);
      await client.query("COMMIT"); return qualityFromRow(row);
    } catch (error) { await client.query("ROLLBACK"); if ((error as { code?: string }).code === "23505") return null; throw error; } finally { client.release(); }
  }
  async list(taskIds?: string[]): Promise<QualityRecord[]> {
    const result = taskIds ? await getDatabasePool().query<QualityRow>(`SELECT ${selectQuality} FROM quality_records WHERE production_task_id = ANY($1::uuid[]) ORDER BY updated_at DESC`, [taskIds]) : await getDatabasePool().query<QualityRow>(`SELECT ${selectQuality} FROM quality_records ORDER BY updated_at DESC`);
    return result.rows.map(qualityFromRow);
  }
  async get(id: string): Promise<QualityRecord | null> { const result = await getDatabasePool().query<QualityRow>(`SELECT ${selectQuality} FROM quality_records WHERE id = $1`, [id]); return result.rows[0] ? qualityFromRow(result.rows[0]) : null; }
  async historyFor(id: string): Promise<QualityHistoryEntry[]> { const result = await getDatabasePool().query<HistoryRow>("SELECT id, quality_record_id, occurred_at, actor_user_id, status, note FROM quality_record_history WHERE quality_record_id = $1 ORDER BY occurred_at", [id]); return result.rows.map(historyFromRow); }
  async correct(id: string, correctiveAction: string, actorUserId: string, at = new Date().toISOString()): Promise<QualityRecord | null> {
    const action = clean(correctiveAction); if (!action) return null; const client = await getDatabasePool().connect();
    try {
      await client.query("BEGIN"); const result = await client.query<QualityRow>(`UPDATE quality_records SET status = 'corrected', corrective_action = $1, updated_at = $2 WHERE id = $3 AND status = 'open' RETURNING ${selectQuality}`, [action, at, id]); const row = result.rows[0]; if (!row) { await client.query("ROLLBACK"); return null; }
      await client.query("INSERT INTO quality_record_history (id, quality_record_id, occurred_at, actor_user_id, status, note) VALUES ($1, $2, $3, $4, 'corrected', $5)", [randomUUID(), id, at, actorUserId, "技術員已記錄矯正處置"]); await client.query("INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, 'quality_record.corrected', 'quality_record', $3)", [randomUUID(), actorUserId, id]); await client.query("COMMIT"); return qualityFromRow(row);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  async close(id: string, actorUserId: string, at = new Date().toISOString()): Promise<QualityRecord | null> {
    const client = await getDatabasePool().connect();
    try {
      await client.query("BEGIN"); const result = await client.query<QualityRow>(`UPDATE quality_records SET status = 'closed', updated_at = $1 WHERE id = $2 AND status = 'corrected' AND corrective_action IS NOT NULL RETURNING ${selectQuality}`, [at, id]); const row = result.rows[0]; if (!row) { await client.query("ROLLBACK"); return null; }
      await client.query("INSERT INTO quality_record_history (id, quality_record_id, occurred_at, actor_user_id, status, note) VALUES ($1, $2, $3, $4, 'closed', $5)", [randomUUID(), id, at, actorUserId, "管理員已結案不合格紀錄"]); await client.query("INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, 'quality_record.closed', 'quality_record', $3)", [randomUUID(), actorUserId, id]); await client.query("COMMIT"); return qualityFromRow(row);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  async trace(batchOrSerial: string): Promise<QualityRecord[]> { const batch = clean(batchOrSerial); if (!batch) return []; const result = await getDatabasePool().query<QualityRow>(`SELECT ${selectQuality} FROM quality_records WHERE batch_or_serial = $1 ORDER BY updated_at DESC`, [batch]); return result.rows.map(qualityFromRow); }
}

let store: QualityRecordStore = hasPostgresRuntime() ? new PostgresQualityRecordStore() : new MemoryQualityRecordStore();
export const getQualityRecordStore = (): QualityRecordStore => store;
export const resetQualityRecordStoreForTests = (): void => { store = new MemoryQualityRecordStore(); };
