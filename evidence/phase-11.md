# Phase 11 Evidence — Work Orders、Production 與 Equipment status

Status: passed
Phase: 11
Acceptance criteria satisfied:
- AC-013
Base revision: e056bf93b954403274cd87ece1fa5f713b1df457
Result revision: working tree (uncommitted)

## Outcome

Work Orders、Production 與 Equipment 已拆為專屬頁並完全使用既有 API。管理員可建立／指派人工作業及指派工單；獲指派技術員可回報作業並以處置內容結案工單。Equipment 只讀取五線模擬 snapshot；Production Orders、Telemetry 與 Maintenance 都明確標示為無 API，沒有設備控制或假資料。

## Verification

Command: `npm run lint && npm run typecheck && npm test && npm run build && git diff --check`
Result: passed.
Observed: 27/27 tests passed；production build 生成 Production、Equipment、Work Orders routes，並保留既有 API routes。

Check: 本機 built app 的管理員／技術員 browser flow。
Result: passed.
Observed: 技術員看見 Production task table、Production Orders 不可用、Equipment 五線與 Telemetry／Maintenance 不可用。管理員建立並指派「Phase 11 UI 驗收作業」，再把既有異常工單指派給設備技術員並看到「處置中」。技術員送出 task report，填寫「已依 SOP 完成模擬檢查與復歸」後將該工單結案，畫面顯示「已結案」及處置內容。

## Remaining risks

- Phase 05／AC-008 的 Docker Compose 實境驗收仍缺 Docker CLI。
- Production Orders、Telemetry 與 Maintenance 尚無 API，維持明確不可用狀態。

## Next action

Phase 12：以既有 quality-record、traceability API 完成 Quality／Inspection／Traceability 專屬頁。
