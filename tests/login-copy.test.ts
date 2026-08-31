import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("src/app/page.tsx", "utf8");

test("登入頁不把開發示範帳密誤稱為部署 runtime 帳密", () => {
  assert.match(page, /帳密由目前部署環境管理/);
  assert.ok(page.includes("INITIAL_ADMIN_*") && page.includes("INITIAL_TECHNICIAN_*"));
  assert.match(page, /既有 volume 不會因 `.env` 變更而重設帳密/);
  assert.match(page, /未設定 `DATABASE_URL` 的本機開發模式才可使用/);
  assert.doesNotMatch(page, /請使用本機示範帳號登入/);
});
