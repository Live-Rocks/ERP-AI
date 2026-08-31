import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("src/components/factory/app-shell.tsx", "utf8");
const styles = readFileSync("src/app/styles.css", "utf8");

test("app shell provides responsive navigation, keyboard skip path, and named landmarks", () => {
  for (const text of ["href=\"#main-content\"", "id=\"main-content\"", "跳至主要內容", "aria-label=\"開啟主要導覽\"", "aria-current", "lg:hidden", "hidden w-[15.5rem] lg:block", "max-w-[86vw]"]) assert.ok(shell.includes(text));
  assert.match(shell, /role="status" aria-live="polite"/);
  assert.match(shell, /focus:not-sr-only/);
  assert.match(shell, /document\.getElementById\("main-content"\)\?\.focus\(\)/);
});

test("shared presentation keeps visible focus, semantic tables, alerts, and textual status", () => {
  const table = readFileSync("src/components/factory/data-table.tsx", "utf8");
  const badge = readFileSync("src/components/factory/status-badge.tsx", "utf8");
  const overview = readFileSync("src/components/factory/overview-dashboard.tsx", "utf8");
  assert.match(styles, /outline-ring/);
  assert.match(table, /overflow-x-auto/);
  assert.match(table, /<caption className="sr-only">/);
  assert.match(badge, /\{children \?\? definition\.label\}/);
  assert.match(overview, /aria-live="polite"/);
  assert.match(overview, /不會用快取或捏造的營運資料替代失敗回應/);
});
