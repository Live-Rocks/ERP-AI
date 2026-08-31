# Phase 13 Evidence — AI Copilot、Audit Log 與 Settings

Status: passed
Phase: 13
Acceptance criteria satisfied:

- AC-015
Base revision: e056bf93b954403274cd87ece1fa5f713b1df457
Result revision: working tree (uncommitted)

## Implemented outcome

`/dashboard/copilot`、`/dashboard/audit` 與 `/dashboard/settings` 已由專屬 client pages 取代 placeholder。三頁僅使用既有 `/api/auth/me`、`/api/ai/advice` 與 `/api/admin/audit`；沒有新增 server route、schema、RBAC、設備控制、雲端服務或可寫設定。Copilot 明確顯示 server sources 與人員參考限制，Audit Log 對技術員顯示 API 的 server-side 403，Settings 只讀帳號與部署邊界。

## Verification

Command: `npm run lint && npm run typecheck && npm test && npm run build && git diff --check`
Result: passed.
Observed: TypeScript lint/typecheck 通過；31/31 tests passed，包含 Phase 13 endpoint、來源、unavailable state、admin-only audit 與 read-only Settings static regression；production build 成功。

Check: browser administrator opens AI Copilot, asks the local advice API, opens Audit Log and Settings.
Result: passed.
Observed: Copilot 顯示繁中建議、`SOP-COOL-001`、line-03 alert 與 resolved work order source，並顯示「僅供人員參考」和無設備控制說明；Audit Log 顯示真實 `ai.advice`、quality、work-order 和 auth events；Settings 顯示目前管理員帳號及 PostgreSQL／Ollama、本機模擬、無 PLC／雲端／可寫設定邊界。

Check: browser technician opens `/dashboard/audit`.
Result: passed.
Observed: 頁面顯示「僅限管理員查看」與 server-side `/api/admin/audit` restriction；沒有 audit data 或 client-side privilege bypass。

Command: `docker compose -p erp-ai-phase12 build --quiet app && docker compose -p erp-ai-phase12 up -d --force-recreate app && curl --fail http://127.0.0.1:3000/api/health`
Result: passed.
Observed: 已在隔離 Compose app image browser-test；health 回傳 `status: ok`、`storage: postgresql` 與 `localOnly: true`，PostgreSQL／Ollama volumes 未刪除。
