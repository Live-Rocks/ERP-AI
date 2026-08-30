import assert from "node:assert/strict";
import test from "node:test";
import { GET as overview } from "../src/app/api/factory/overview/route";
import { PATCH as updateWorkOrder } from "../src/app/api/work-orders/[id]/route";
import { createSessionToken } from "../src/server/session";
import { createFactoryStore, resetFactoryStoreForTests } from "../src/server/factory-store";
import { MemoryAuthRepository, setAuthRepositoryForTests } from "../src/server/repositories";

test("模擬 provider 固定回傳五條產線，並以五秒快照更新", async () => {
  const { provider } = createFactoryStore();
  const first = await provider.refresh(new Date(0));
  const second = await provider.refresh(new Date(5000));
  assert.equal(first.lines.length, 5);
  assert.deepEqual(first.lines.map((line) => line.id), ["line-01", "line-02", "line-03", "line-04", "line-05"]);
  assert.ok(first.lines.every((line) => line.producedUnits >= 1200 && line.lastUpdatedAt));
  assert.notEqual(first.refreshedAt, second.refreshedAt);
});

test("同一未結案模擬異常只建立一張待指派工單", async () => {
  const { provider } = createFactoryStore();
  const first = await provider.refresh(new Date(0));
  const repeated = await provider.refresh(new Date(5000));
  assert.equal(first.alerts.length, 1);
  assert.equal(first.pendingWorkOrders.length, 1);
  assert.equal(repeated.alerts.length, 1);
  assert.equal(repeated.pendingWorkOrders.length, 1);
  assert.equal(repeated.pendingWorkOrders[0]?.status, "pending_assignment");
});

test("產線 overview API 要求登入，但兩種角色皆可讀取", async () => {
  resetFactoryStoreForTests();
  setAuthRepositoryForTests(new MemoryAuthRepository());
  const unauthenticated = await overview(new Request("http://localhost/api/factory/overview"));
  assert.equal(unauthenticated.status, 401);

  for (const [id, role] of [["00000000-0000-4000-8000-000000000001", "admin"], ["00000000-0000-4000-8000-000000000002", "technician"]] as const) {
    const token = createSessionToken(id, role);
    const response = await overview(new Request("http://localhost/api/factory/overview", { headers: { cookie: `erp_session=${token}` } }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).lines.length, 5);
  }
});

test("管理員指派後，只有被指派技術員可記錄處置並結案，且保留歷程", async () => {
  resetFactoryStoreForTests();
  setAuthRepositoryForTests(new MemoryAuthRepository());
  const { provider } = createFactoryStore();
  const created = await provider.refresh(new Date(0));
  const workOrderId = created.pendingWorkOrders[0]?.id;
  assert.ok(workOrderId);
  const factory = await import("../src/server/factory-store");
  const globalWorkOrderId = (await factory.getFactoryProvider().refresh(new Date(0))).pendingWorkOrders[0]?.id;
  assert.ok(globalWorkOrderId);
  const adminToken = createSessionToken("00000000-0000-4000-8000-000000000001", "admin");
  const assign = await updateWorkOrder(new Request(`http://localhost/api/work-orders/${globalWorkOrderId}`, { method: "PATCH", headers: { cookie: `erp_session=${adminToken}`, "content-type": "application/json" }, body: JSON.stringify({ action: "assign", technicianUserId: "00000000-0000-4000-8000-000000000002" }) }), { params: Promise.resolve({ id: globalWorkOrderId }) });
  assert.equal(assign.status, 200);
  const technicianToken = createSessionToken("00000000-0000-4000-8000-000000000002", "technician");
  const resolve = await updateWorkOrder(new Request(`http://localhost/api/work-orders/${globalWorkOrderId}`, { method: "PATCH", headers: { cookie: `erp_session=${technicianToken}`, "content-type": "application/json" }, body: JSON.stringify({ action: "resolve", resolution: "已完成冷卻風扇檢查與復歸" }) }), { params: Promise.resolve({ id: globalWorkOrderId }) });
  assert.equal(resolve.status, 200);
  assert.equal((await factory.getFactoryStore().historyFor(globalWorkOrderId)).length, 3);
});
