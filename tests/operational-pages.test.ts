import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Phase 11 專屬頁只呼叫既有營運 API，並保留資料缺口狀態", () => {
  const source = readFileSync("src/components/factory/operational-pages.tsx", "utf8");
  for (const endpoint of ["/api/factory/overview", "/api/work-orders/${order.id}", "/api/production-tasks", "/api/production-tasks/${task.id}", "/api/admin/users"]) assert.ok(source.includes(endpoint));
  for (const unavailable of ["Production Orders API", "telemetry history API", "maintenance record API"]) assert.ok(source.includes(unavailable));
  assert.match(source, /action: "assign"/);
  assert.match(source, /action: "resolve"/);
  assert.match(source, /action: "report"/);
});
