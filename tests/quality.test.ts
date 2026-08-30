import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GET as audit } from "../src/app/api/admin/audit/route";
import { POST as createTask } from "../src/app/api/production-tasks/route";
import { PATCH as updateQuality } from "../src/app/api/quality-records/[id]/route";
import { GET as listQuality, POST as createQuality } from "../src/app/api/quality-records/route";
import { GET as trace } from "../src/app/api/traceability/route";
import { resetActivityForTests } from "../src/server/activity-log";
import { resetProductionTaskStoreForTests } from "../src/server/execution-store";
import { resetQualityRecordStoreForTests } from "../src/server/quality-store";
import { MemoryAuthRepository, setAuthRepositoryForTests } from "../src/server/repositories";
import { hashPassword, type User } from "../src/domain/auth";
import { createSessionToken } from "../src/server/session";

const adminId = "00000000-0000-4000-8000-000000000001";
const technicianId = "00000000-0000-4000-8000-000000000002";
const otherTechnicianId = "00000000-0000-4000-8000-000000000003";
const users: User[] = [
  { id: adminId, username: "admin", displayName: "廠務管理員", role: "admin", passwordHash: hashPassword("admin-demo") },
  { id: technicianId, username: "tech", displayName: "設備技術員", role: "technician", passwordHash: hashPassword("tech-demo") },
  { id: otherTechnicianId, username: "tech-2", displayName: "其他技術員", role: "technician", passwordHash: hashPassword("tech-2-demo") }
];

const request = (url: string, token: string, method = "GET", body?: object): Request => new Request(url, { method, headers: { cookie: `erp_session=${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

function reset(): void {
  resetActivityForTests(); resetProductionTaskStoreForTests(); resetQualityRecordStoreForTests(); setAuthRepositoryForTests(new MemoryAuthRepository(users));
}

async function assignedTask(adminToken: string): Promise<{ id: string; lineId: string }> {
  const response = await createTask(request("http://localhost/api/production-tasks", adminToken, "POST", { lineId: "line-01", title: "組裝線首件巡檢", technicianUserId: technicianId }));
  assert.equal(response.status, 201); return response.json();
}

test("管理員建立不合格；只有獲指派技術員可矯正，管理員再結案", async () => {
  reset(); const admin = createSessionToken(adminId, "admin"); const technician = createSessionToken(technicianId, "technician"); const other = createSessionToken(otherTechnicianId, "technician"); const task = await assignedTask(admin);
  const create = await createQuality(request("http://localhost/api/quality-records", admin, "POST", { productionTaskId: task.id, lineId: task.lineId, batchOrSerial: "LOT-20260830-A", inspectionResult: "fail", defectDescription: "首件尺寸超出公差" }));
  assert.equal(create.status, 201); const record = await create.json(); assert.equal(record.status, "open");
  assert.equal((await updateQuality(request(`http://localhost/api/quality-records/${record.id}`, other, "PATCH", { action: "correct", correctiveAction: "調整治具" }), params(record.id))).status, 403);
  assert.equal((await updateQuality(request(`http://localhost/api/quality-records/${record.id}`, technician, "PATCH", { action: "correct", correctiveAction: "調整治具並重測首件" }), params(record.id))).status, 200);
  const close = await updateQuality(request(`http://localhost/api/quality-records/${record.id}`, admin, "PATCH", { action: "close" }), params(record.id)); assert.equal(close.status, 200); assert.equal((await close.json()).status, "closed");
  assert.equal((await updateQuality(request(`http://localhost/api/quality-records/${record.id}`, technician, "PATCH", { action: "correct", correctiveAction: "不應再寫入" }), params(record.id))).status, 409);
});

test("品質 API 要求缺陷描述、隱藏未指派資料，並提供管理員批次追溯與稽核", async () => {
  reset(); const admin = createSessionToken(adminId, "admin"); const technician = createSessionToken(technicianId, "technician"); const other = createSessionToken(otherTechnicianId, "technician"); const task = await assignedTask(admin);
  assert.equal((await createQuality(request("http://localhost/api/quality-records", admin, "POST", { productionTaskId: task.id, lineId: task.lineId, batchOrSerial: "LOT-20260830-B", inspectionResult: "fail" }))).status, 400);
  const created = await createQuality(request("http://localhost/api/quality-records", admin, "POST", { productionTaskId: task.id, lineId: task.lineId, batchOrSerial: "LOT-20260830-B", inspectionResult: "fail", defectDescription: "表面刮傷" })); const record = await created.json();
  assert.equal((await (await listQuality(request("http://localhost/api/quality-records", technician))).json()).length, 1);
  assert.equal((await (await listQuality(request("http://localhost/api/quality-records", other))).json()).length, 0);
  assert.equal((await trace(request("http://localhost/api/traceability?batchOrSerial=LOT-20260830-B", other))).status, 403);
  await updateQuality(request(`http://localhost/api/quality-records/${record.id}`, technician, "PATCH", { action: "correct", correctiveAction: "更換防護片" }), params(record.id));
  await updateQuality(request(`http://localhost/api/quality-records/${record.id}`, admin, "PATCH", { action: "close" }), params(record.id));
  const traced = await trace(request("http://localhost/api/traceability?batchOrSerial=LOT-20260830-B", admin)); assert.equal(traced.status, 200); const traceBody = await traced.json();
  assert.equal(traceBody.records.length, 1); assert.equal(traceBody.records[0].task.id, task.id); assert.deepEqual(traceBody.records[0].history.map((entry: { status: string }) => entry.status), ["open", "corrected", "closed"]);
  const auditEvents = await (await audit(request("http://localhost/api/admin/audit", admin))).json();
  for (const action of ["quality_record.created", "quality_record.corrected", "quality_record.closed"]) assert.ok(auditEvents.some((event: { action: string }) => event.action === action));
});

test("品質紀錄限制相同作業批次重複與不相符產線", async () => {
  reset(); const admin = createSessionToken(adminId, "admin"); const task = await assignedTask(admin);
  const create = (body: object) => createQuality(request("http://localhost/api/quality-records", admin, "POST", body));
  assert.equal((await create({ productionTaskId: task.id, lineId: "line-02", batchOrSerial: "SER-009", inspectionResult: "pass" })).status, 400);
  assert.equal((await create({ productionTaskId: task.id, lineId: task.lineId, batchOrSerial: "SER-009", inspectionResult: "pass" })).status, 201);
  assert.equal((await create({ productionTaskId: task.id, lineId: task.lineId, batchOrSerial: "SER-009", inspectionResult: "pass" })).status, 400);
});

test("PostgreSQL migration 定義品質追溯、缺陷與不可變歷程", () => {
  const sql = readFileSync("db/migrations/0004_quality_traceability.sql", "utf8");
  for (const statement of ["CREATE TABLE quality_records", "CREATE TABLE quality_record_history", "batch_or_serial", "inspection_result IN ('pass', 'fail')", "quality_records_batch_or_serial_idx"]) assert.ok(sql.includes(statement));
});
