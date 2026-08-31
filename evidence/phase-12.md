# Phase 12 Evidence — Quality、Inspection 與 Traceability

Status: passed
Phase: 12
Acceptance criteria satisfied:

- AC-014
Base revision: e056bf93b954403274cd87ece1fa5f713b1df457
Result revision: working tree (uncommitted)

## Implemented outcome

`/dashboard/quality` 已由專屬 client page 取代 placeholder，僅使用既有 `/api/auth/me`、`/api/production-tasks`、`/api/quality-records` 與 `/api/traceability`。管理員 UI 可建立檢驗、結案與查批次；技術員 UI 只顯示獲授權紀錄的矯正輸入。紀錄、矯正及追溯歷程皆呈現在頁面上，server-side RBAC 沒有變更。

## Verification

### Passed automated checks

Command: `npm run lint && npm run typecheck && npm test && npm run build && git diff --check`
Result: passed.
Observed: TypeScript lint 與 typecheck 均成功；29/29 tests passed（包括原有 quality RBAC、缺陷描述、矯正／結案、批次追溯與 audit tests，以及新增的 Quality page API／workflow static tests）；production build 成功產生 `/dashboard/quality`。

Check: `./check-harness.sh && ./check-run-state.sh && git diff --check && git diff --name-only e056bf9 -- src/app/api src/server db`
Result: passed before this phase was marked blocked.
Observed: Harness 結構與 run state 有效，且沒有 API、server 或資料庫 schema 檔案差異。

## Initial blocked browser attempt (preserved)

Check: 在隔離的本機 standalone（port 3001）及單一開發 runtime（port 3002）執行管理員建立人工現場作業、建立不合格檢驗、技術員矯正、管理員結案與批次追溯。
Result: blocked; full role workflow could not be completed.
Observed: 管理員在 Production 頁建立並指派「Phase 12 品質驗證作業」時，`POST /api/production-tasks` 回傳 201，且同頁表格顯示該作業。切換到 Quality 頁後，該頁使用的 `GET /api/production-tasks` 回傳空列表，故無可選作業來建立關聯品質紀錄。這在 standalone 與開發 runtime 都重現；未設定 `DATABASE_URL` 時，各 route worker 的 in-memory store 不共享。技術員 Quality 頁及 768px tablet layout 可正確顯示 Quality 表格與不越權的 UI，但不足以證明完整 AC-014 browser flow。

## Blocker and recovery

這不是 Quality UI、RBAC、API contract 或 schema 的失敗；既有 `tests/quality.test.ts` 已在同一測試程序完整驗證 AC-010 相關跨 API 流程。AC-014 所需的真實跨 route browser 驗證已在 Phase 05 的共享 PostgreSQL Compose runtime 重跑並通過。

## Passing browser verification

Check: 在隔離 `erp-ai-phase12` Compose runtime，以 browser 執行 administrator → technician → administrator 的完整 Quality flow。
Result: passed.
Observed:

- 管理員建立並指派 `Phase 12 批次追溯驗收作業` 至 line-03 的測試技術員。
- 管理員以 `P12-TRACE-001` 建立不合格檢驗，包含缺陷描述。
- 獲指派技術員寫入「完成治具校正、重新檢驗並隔離不合格品」的矯正處置。
- 管理員確認矯正後結案；Quality UI 顯示 `待矯正 → 待結案 → 已結案` 不可變歷程。
- 管理員以 `P12-TRACE-001` 查到 1 筆記錄，含 line-03 作業、缺陷、矯正處置及完整歷程。

Check: isolated PostgreSQL audit query.
Result: passed.
Observed: `production_task.created`、`production_task.assigned`、`quality_record.created`、`quality_record.corrected` 與 `quality_record.closed` 各至少一筆。

Command: `npm test && npm run lint && npm run typecheck && npm run build && git diff --check`
Result: passed.
Observed: 29/29 tests passed；quality RBAC、缺陷描述、矯正／結案與追溯測試全數通過，production build 成功。
