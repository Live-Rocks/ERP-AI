# Phase 09 Evidence — 前端設計系統、Sidebar、Topbar 與 app shell

Status: passed
Phase: 09
Acceptance criteria satisfied:
- AC-011
Base revision: e056bf93b954403274cd87ece1fa5f713b1df457
Result revision: working tree (uncommitted)

## Outcome

已登入的管理員與技術員皆可使用深色、繁中、工業 SaaS app shell。Desktop 顯示固定 Sidebar 與 Topbar；tablet 以具標題和 focus 行為的 Sheet 提供主導覽。八個功能頁均可導覽；尚沒有資料 API 的區塊顯示明確不可用狀態，沒有捏造營運數據。既有登入、登出與 server-side RBAC API 均未改動。

## Changes

- 導入 Tailwind CSS v4、shadcn/ui、Lucide React 與 Recharts foundation，建立唯一深色工業 token 與本機優先視覺語言。
- 建立 reusable `StatusBadge`、`PageHeader`、`StatCard`、`ProductionLineCard`、`AlertList`、`DataTable`、`PagePlaceholder` 與 client `AppShell`。
- 將 `/dashboard` 改為 Sidebar／Topbar shell，新增 Production、Equipment、Work Orders、Quality、AI Copilot、Audit Log、Settings route skeleton，並更新登入頁與架構文件。
- 修正 browser verification 發現的兩個 Base UI composition 問題：`SheetTrigger` 現在位於 `Sheet` root 內；`DropdownMenuLabel` 現在位於 `DropdownMenuGroup` 內。

## Verification

### Command / Check

Command: `npm run lint && npm run typecheck && npm test && npm run build && ./check-harness.sh && ./check-run-state.sh && git diff --check && git diff --name-only e056bf9 -- src/app/api src/server db`
Result: passed; all commands exited 0, and the final API/server/schema diff command produced no output.
Observed: 23/23 automated tests passed, including the new app-shell route/component regression checks. Production build generated all eight dashboard routes. Harness reported 16/16 acceptance criteria covered, Current phase 09 during verification, and the unrelated Docker Compose blocker present.

```text
ℹ tests 23
ℹ pass 23
ℹ fail 0
✓ Compiled successfully
Harness starter is structurally complete.
Harness run state is valid.
Acceptance criteria: 16/16 covered
Passed phases: 6
Current phase: 09
Blockers: present
```

### User-observable check

Check: Built the local production app, served its standalone runtime with the same `.next/static` layout as the Dockerfile, and used `127.0.0.1` as both documented demo roles.
Result: passed.
Observed: 管理員登入後可看見 desktop Sidebar、Topbar、帳號選單、Overview 指標缺口狀態及八個導覽項目；進入 Production 後，URL 和 active navigation 正確變為 `/dashboard/production`，並顯示不造假的資料介面未提供狀態。768px viewport 下，主導覽按鈕開啟語意化 `主要導覽` Sheet，包含所有導覽項目與 close control。管理員帳號選單可開啟並成功登出回登入頁；技術員登入後，Topbar 正確顯示「設備技術員／技術員」並可載入相同 shell。原有 automated API regression 仍確認所有實際授權在 server-side 執行。

## Remaining risks

- Phase 10 才會把既有 overview API 資料接進 KPI、trend、五線、alerts 與 work orders；本 phase 的 `—` 是資料誠實缺口，而不是缺失的模擬值。
- Phase 05／AC-008 的 Docker Compose 實境驗收仍缺 Docker CLI；此 UI phase 不改變 release blocker。

## Next action

Phase 10 是下一個符合依賴條件的 UI phase：以既有 `/api/factory/overview` 實作資料真實的 Overview Dashboard，並保持 OEE／停機時間不可用狀態。
