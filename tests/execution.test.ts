import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GET as audit } from "../src/app/api/admin/audit/route";
import { POST as createTask, GET as listTasks } from "../src/app/api/production-tasks/route";
import { PATCH as updateTask } from "../src/app/api/production-tasks/[id]/route";
import { resetActivityForTests } from "../src/server/activity-log";
import { resetProductionTaskStoreForTests } from "../src/server/execution-store";
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
const request = (url: string, token: string, body?: object) => new Request(url, { method: body ? "PATCH" : "GET", headers: { cookie: `erp_session=${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });

function reset(): void {
  resetActivityForTests(); resetProductionTaskStoreForTests(); setAuthRepositoryForTests(new MemoryAuthRepository(users));
}

test("管理員建立並指派人工現場作業；技術員只能查看自己的作業", async () => {
  reset(); const admin = createSessionToken(adminId, "admin"); const technician = createSessionToken(technicianId, "technician"); const other = createSessionToken(otherTechnicianId, "technician");
  assert.equal((await createTask(new Request("http://localhost/api/production-tasks", { method: "POST", headers: { cookie: `erp_session=${technician}`, "content-type": "application/json" }, body: JSON.stringify({ lineId: "line-01", title: "巡檢" }) }))).status, 403);
  const created = await createTask(new Request("http://localhost/api/production-tasks", { method: "POST", headers: { cookie: `erp_session=${admin}`, "content-type": "application/json" }, body: JSON.stringify({ lineId: "line-01", title: "組裝線首件巡檢", technicianUserId: technicianId }) }));
  assert.equal(created.status, 201); const task = await created.json(); assert.equal(task.status, "planned");
  assert.equal((await (await listTasks(request("http://localhost/api/production-tasks", technician))).json()).length, 1);
  assert.equal((await (await listTasks(request("http://localhost/api/production-tasks", other))).json()).length, 0);
});

test("只有獲指派技術員能依有效狀態回報，並累計產出、歷程與稽核", async () => {
  reset(); const admin = createSessionToken(adminId, "admin"); const technician = createSessionToken(technicianId, "technician"); const other = createSessionToken(otherTechnicianId, "technician");
  const created = await createTask(new Request("http://localhost/api/production-tasks", { method: "POST", headers: { cookie: `erp_session=${admin}`, "content-type": "application/json" }, body: JSON.stringify({ lineId: "line-02", title: "加工線生產回報", technicianUserId: technicianId }) })); const task = await created.json();
  const update = (token: string, body: object) => updateTask(request(`http://localhost/api/production-tasks/${task.id}`, token, body), { params: Promise.resolve({ id: task.id }) });
  assert.equal((await update(other, { action: "report", status: "in_progress", goodUnits: 0, rejectedUnits: 0 })).status, 409);
  assert.equal((await update(technician, { action: "report", status: "in_progress", goodUnits: 12, rejectedUnits: 1 })).status, 200);
  assert.equal((await update(technician, { action: "report", status: "paused", goodUnits: 0, rejectedUnits: 0, downtimeReason: "更換治具" })).status, 200);
  assert.equal((await update(technician, { action: "report", status: "in_progress", goodUnits: 3, rejectedUnits: 0 })).status, 200);
  const completed = await update(technician, { action: "report", status: "completed", goodUnits: 5, rejectedUnits: 0 }); assert.equal(completed.status, 200); const finalTask = await completed.json();
  assert.equal(finalTask.goodUnits, 20); assert.equal(finalTask.rejectedUnits, 1);
  assert.equal((await update(technician, { action: "report", status: "in_progress", goodUnits: 0, rejectedUnits: 0 })).status, 409);
  const listed = await (await listTasks(request("http://localhost/api/production-tasks", admin))).json(); assert.equal(listed[0].history.length, 5);
  const auditEvents = await (await audit(request("http://localhost/api/admin/audit", admin))).json();
  assert.ok(auditEvents.some((event: { action: string }) => event.action === "production_task.created"));
  assert.equal(auditEvents.filter((event: { action: string }) => event.action === "production_task.reported").length, 4);
});

test("作業 API 拒絕未知產線、負數回報與未登入存取", async () => {
  reset(); const admin = createSessionToken(adminId, "admin"); const technician = createSessionToken(technicianId, "technician");
  assert.equal((await listTasks(new Request("http://localhost/api/production-tasks"))).status, 401);
  assert.equal((await createTask(new Request("http://localhost/api/production-tasks", { method: "POST", headers: { cookie: `erp_session=${admin}`, "content-type": "application/json" }, body: JSON.stringify({ lineId: "line-99", title: "不應建立" }) }))).status, 400);
  const created = await createTask(new Request("http://localhost/api/production-tasks", { method: "POST", headers: { cookie: `erp_session=${admin}`, "content-type": "application/json" }, body: JSON.stringify({ lineId: "line-03", title: "檢測", technicianUserId: technicianId }) })); const task = await created.json();
  assert.equal((await updateTask(request(`http://localhost/api/production-tasks/${task.id}`, technician, { action: "report", status: "in_progress", goodUnits: -1, rejectedUnits: 0 }), { params: Promise.resolve({ id: task.id }) })).status, 400);
});

test("PostgreSQL migration 定義人工現場作業與不可變回報歷程", () => {
  const sql = readFileSync("db/migrations/0003_production_execution.sql", "utf8");
  for (const statement of ["CREATE TABLE production_tasks", "CREATE TABLE production_task_history", "CHECK (good_units >= 0)", "CHECK (rejected_units >= 0)"]) assert.ok(sql.includes(statement));
});
