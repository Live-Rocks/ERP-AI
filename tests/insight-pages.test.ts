import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/components/factory/insight-pages.tsx", "utf8");

test("Phase 13 pages only use the existing auth, AI, and audit APIs", () => {
  for (const endpoint of ["/api/auth/me", "/api/ai/advice", "/api/admin/audit"]) assert.ok(source.includes(endpoint));
  for (const forbidden of ["/api/plc", "/api/opcua", "/api/settings", "fetch(\"http"]) assert.ok(!source.includes(forbidden));
});

test("AI sources, unavailable state, administrator audit boundary, and read-only settings are explicit", () => {
  for (const text of ["可追溯來源", "僅供人員參考", "模型不可用時不會提供捏造答案", "僅限管理員查看", "server-side", "不提供不存在的寫入介面"]) assert.ok(source.includes(text));
  assert.match(source, /response\.status|!response\.ok/);
  assert.match(source, /user\?\.role === "technician"/);
});
