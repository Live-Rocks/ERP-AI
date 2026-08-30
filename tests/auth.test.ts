import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { authenticate, currentUser, requireAdmin } from "../src/server/auth-service";
import { MemoryAuthRepository, setAuthRepositoryForTests } from "../src/server/repositories";
import { createSessionToken, verifySessionToken } from "../src/server/session";
import { POST as login } from "../src/app/api/auth/login/route";
import { GET as listUsers } from "../src/app/api/admin/users/route";

function resetRepository() {
  setAuthRepositoryForTests(new MemoryAuthRepository());
}

test("管理員可登入、取得 session 並被授權", async () => {
  resetRepository();
  const result = await authenticate("admin", "admin-demo");
  assert.ok(result);
  assert.equal(result.user.role, "admin");
  assert.equal((await requireAdmin(result.token))?.username, "admin");
});

test("技術員可登入但不能執行管理員操作", async () => {
  resetRepository();
  const result = await authenticate("tech", "tech-demo");
  assert.ok(result);
  assert.equal(result.user.role, "technician");
  assert.equal(await requireAdmin(result.token), null);
});

test("錯誤密碼與遭竄改 session 會被拒絕", async () => {
  resetRepository();
  assert.equal(await authenticate("admin", "wrong"), null);
  const token = createSessionToken("00000000-0000-4000-8000-000000000001", "admin");
  assert.equal(verifySessionToken(`${token}x`), null);
  assert.equal(await currentUser("invalid"), null);
});

test("登入會寫入稽核事件", async () => {
  const repository = new MemoryAuthRepository();
  setAuthRepositoryForTests(repository);
  await authenticate("admin", "admin-demo");
  assert.equal((await repository.listAudit())[0]?.action, "auth.login");
});

test("登入 API 設定 HttpOnly session，且管理員 API 拒絕技術員", async () => {
  resetRepository();
  const loginResponse = await login(new Request("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "tech", password: "tech-demo" }),
    headers: { "content-type": "application/json" }
  }));
  assert.equal(loginResponse.status, 200);
  const cookie = loginResponse.headers.get("set-cookie");
  assert.match(cookie ?? "", /HttpOnly/);
  const technicianResponse = await listUsers(new Request("http://localhost/api/admin/users", { headers: { cookie: cookie ?? "" } }));
  assert.equal(technicianResponse.status, 403);

  const administratorToken = createSessionToken("00000000-0000-4000-8000-000000000001", "admin");
  const administratorResponse = await listUsers(new Request("http://localhost/api/admin/users", { headers: { cookie: `erp_session=${administratorToken}` } }));
  assert.equal(administratorResponse.status, 200);
  assert.equal((await administratorResponse.json()).length, 2);
});

test("PostgreSQL migration 定義角色、使用者、session 與稽核資料表", () => {
  const sql = readFileSync("db/migrations/0001_auth.sql", "utf8");
  for (const statement of ["CREATE TYPE user_role", "CREATE TABLE users", "CREATE TABLE sessions", "CREATE TABLE audit_events"]) {
    assert.match(sql, new RegExp(statement));
  }
});
