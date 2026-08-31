import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("src/components/factory/quality-page.tsx", "utf8");

test("品質頁只串接既有品質、作業、認證與追溯 API", () => {
  for (const endpoint of ["/api/auth/me", "/api/production-tasks", "/api/quality-records", "/api/traceability"]) assert.ok(page.includes(endpoint));
  assert.ok(!page.includes("/api/plc"));
  assert.ok(!page.includes("/api/opcua"));
});

test("品質頁顯示既有角色 workflow 與批次追溯歷程", () => {
  for (const text of ["建立檢驗紀錄", "提交矯正處置", "確認矯正並結案", "Batch / Serial Traceability", "品質處置與歷程"]) assert.ok(page.includes(text));
  assert.ok(page.includes('action: "correct"'));
  assert.ok(page.includes('action: "close"'));
});
