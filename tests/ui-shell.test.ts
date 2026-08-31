import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("app shell 保留既有登入端點並提供所有核准功能頁導覽", () => {
  const shell = read("src/components/factory/app-shell.tsx");
  for (const route of ["/dashboard", "/dashboard/production", "/dashboard/equipment", "/dashboard/work-orders", "/dashboard/quality", "/dashboard/copilot", "/dashboard/audit", "/dashboard/settings"]) assert.match(shell, new RegExp(`href: "${route}"`));
  assert.match(shell, /fetch\("\/api\/auth\/me"\)/);
  assert.match(shell, /fetch\("\/api\/auth\/logout"/);
});

test("Phase 09 design system 建立可重用元件與明確的資料缺口狀態", () => {
  for (const component of ["status-badge", "stat-card", "production-line-card", "alert-list", "page-header", "data-table", "page-placeholder"]) assert.ok(existsSync(`src/components/factory/${component}.tsx`), `${component} should exist`);
  const overview = read("src/components/factory/overview-dashboard.tsx");
  assert.match(overview, /尚無可驗證的 OEE 資料來源/);
  assert.match(overview, /不會用快取或捏造的營運資料替代失敗回應/);
  const placeholder = read("src/components/factory/page-placeholder.tsx");
  assert.match(placeholder, /資料介面尚未提供/);
});
