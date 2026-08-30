# Phase 01 Evidence — 本機基礎與角色存取

Status: passed
Phase: 01
Acceptance criteria satisfied:
- AC-001
Base revision: 753cfdac848db206de2b4d616bb4b754cc1e4db2
Result revision: working tree (uncommitted)

## Outcome

管理員與技術員可使用本機示範帳號登入。登入 API 建立 HttpOnly session cookie；管理員 API 對技術員回傳 403，且登入與登出具備 audit event 抽象。PostgreSQL migration 已定義 users、sessions 與 audit_events 資料表，但本 phase 未連接任何生產資料庫或設備。

## Changes

- 建立 Next.js TypeScript App Router、登入頁與角色導向首頁。
- 建立 HMAC session、scrypt 密碼驗證、管理員授權 API 與示範 repository。
- 新增 PostgreSQL auth migration、Phase 01 測試、已實作架構與 validation gate 文件。

## Verification

### Command / Check

Command: `npm run lint && npm run typecheck && npm test && npm run build && ./check-harness.sh && ./check-run-state.sh && git diff --check`
Result: passed; every command exited 0.
Observed: TypeScript lint/type checks passed; 6/6 tests passed; Next.js production build completed; harness and run-state checks passed with 8/8 AC covered and no passed phases before this evidence was recorded.

```text
> ai-erp-smart-factory@0.1.0 test
> tsx --test tests/**/*.test.ts

✔ 管理員可登入、取得 session 並被授權
✔ 技術員可登入但不能執行管理員操作
✔ 錯誤密碼與遭竄改 session 會被拒絕
✔ 登入會寫入稽核事件
✔ 登入 API 設定 HttpOnly session，且管理員 API 拒絕技術員
✔ PostgreSQL migration 定義角色、使用者、session 與稽核資料表
ℹ tests 6
ℹ pass 6
ℹ fail 0

> ai-erp-smart-factory@0.1.0 build
> next build

✓ Compiled successfully
✓ Generating static pages (9/9)

Harness starter is structurally complete.
Harness run state is valid.
Acceptance criteria: 8/8 covered
Passed phases: 0
Current phase: 01
Blockers: none
```

## User-observable / system-observable verification

登入頁預設顯示管理員與技術員的本機示範帳號。API route 測試實際驗證技術員登入後取得 session cookie、呼叫 `/api/admin/users` 被拒絕，管理員 session 則可取得使用者清單。

## Remaining risks

- PostgreSQL persistence 與 Docker Compose 由後續 phase 完成；目前 repository 為可測試的示範實作。
- `SESSION_SECRET` 在正式部署前必須由廠內祕密設定覆寫。

## Next action

規劃並執行 Phase 02：五線模擬監控與告警。
