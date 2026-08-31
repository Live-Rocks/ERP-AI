# Phase 14 Evidence — Responsive、Accessibility 與 UI polish

Status: passed
Phase: 14
Acceptance criteria satisfied:

- AC-016
Base revision: e056bf933834d41c341ecef45d642a38e8137627
Result revision: working tree (uncommitted)

## Implemented scope

- 移除登入頁預填的開發 fallback 帳密與「請使用本機示範帳號」錯誤訊息；Compose／既有 PostgreSQL volume 改為顯示正確的 `.env` 初始帳密與不自動輪替說明，密碼不會顯示或提交至版本庫。
- 在 app shell 新增可見於 focus 的「跳至主要內容」連結，目標為可聚焦的 `main#main-content` landmark。
- 保留 desktop Sidebar／tablet Sheet breakpoint、命名導覽、文字狀態、資料表 caption／橫向捲動、`role="status"` loading 與不捏造資料的 empty/error presentation。
- 新增 `tests/accessibility.test.ts` 與 `tests/login-copy.test.ts`，固定檢查上述 keyboard、semantic、focus、non-colour state、responsive class 及部署帳密說明 contract；沒有變更 API、server、database schema、RBAC 或資料來源。
- README、operations、architecture 與 roadmap 的目前部署敘述已同步為已通過的隔離 Compose runtime；保留 append-only ADR、STATE handoff 與歷史 evidence 的當時結果，不回寫歷史。

## Verification

Command: `npm run lint && npm run typecheck && npm test && npm run build && git diff --check`
Result: passed.
Observed: TypeScript lint/typecheck、production build 與 whitespace check 均成功；34/34 tests passed，包含 app shell skip path、visible focus class、named navigation／landmark、loading status、semantic table caption／overflow、文字狀態、overview error non-fabrication 與 login-copy regression。

Check: 在隔離 Compose runtime 的內建 browser 以 541px 寬度驗證目前技術員 session。
Result: passed for the available mobile-width scenario only.
Observed: `innerWidth`／`clientWidth`／`scrollWidth` 均為 541，沒有水平溢位；mobile Sheet 顯示八項主要導覽，且「跳至主要內容」以 Enter 啟動後 browser landmark 顯示 `main [active]`。既有 `evidence/phase-10.md` 已記錄 1440px 與 768px 的可用 layout observation。

## Additional correction verification

Command: `npm run lint && npm run typecheck && npm test && npm run build && git diff --check`
Result: passed.
Observed: TypeScript lint/typecheck 與 production build 成功；34/34 tests passed，包含登入頁不再將開發示範帳密誤稱為 Compose runtime 帳密的 regression。Git whitespace check 無輸出。

Check: rebuilt isolated Compose app, then loaded `http://127.0.0.1:3000/` in a browser.
Result: passed.
Observed: health 回傳 `storage: postgresql`；登入頁的帳號與密碼欄位為空且 required，顯示 `.env` 的 `INITIAL_ADMIN_*`／`INITIAL_TECHNICIAN_*` 只在空白 PostgreSQL volume 初始建立時使用，並將 `admin / admin-demo`、`tech / tech-demo` 限定為未設定 `DATABASE_URL` 的開發模式。PostgreSQL 與 Ollama volumes 未重建或刪除。

## Passed responsive and keyboard verification

Check: 使用者明確允許後，僅將 `.env` 的管理員測試帳密輸入隔離 Compose app `http://127.0.0.1:3000`，並以 browser viewport override 驗證已登入畫面。
Result: passed.
Observed:

- 1920px：Overview 的 `documentWidth` 為 1920；desktop Sidebar 可見、mobile menu 不可見，main 從 248px 開始且寬 1672px；工單摘要表格 client／scroll width 均為 1598px，沒有水平頁面溢位。
- 1440px：Audit Log 的 `documentWidth` 為 1440；desktop Sidebar 可見、mobile menu 不可見，main 寬 1192px；稽核資料表 client／scroll width 均為 1126px。
- 768px：Audit Log 的 `documentWidth` 為 768；desktop Sidebar 隱藏、mobile main-navigation button 可見並成功開啟可見 `主要功能` navigation；稽核資料表 client／scroll width 均為 719px。
- Keyboard focus 可到達 skip link；static regression 明確檢查其 handler 會將焦點移至 `tabIndex=-1` 的 `main#main-content` landmark。所有 line／work-order 狀態仍以繁中文字呈現，不依賴顏色。

## Next action

產品契約的 AC-001 至 AC-016 現均有 passing evidence。下一個 roadmap candidate 是條件式 Phase 08；它必須先取得人員核准的 OT 連線 ADR、唯讀端點／憑證、點位表、網路區隔與變更窗口，否則保持不執行。
