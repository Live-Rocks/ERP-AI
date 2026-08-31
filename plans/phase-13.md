# Phase 13 Plan — AI Copilot、Audit Log 與 Settings

## Goal and acceptance

- Goal: 以既有本機 API 將 AI 建議／來源、管理員稽核資料與部署邊界呈現在專屬頁，維持既有 RBAC 與本機優先安全限制。
- Covers:
  - AC-015
- In scope:
  - 將 `/dashboard/copilot` 改為 client page，讀取既有 `/api/auth/me` 與 `POST /api/ai/advice`，呈現繁中問題、建議、server-provided sources、loading 與 AI unavailable error；不新增任何控制動作。
  - 將 `/dashboard/audit` 改為只使用既有 `/api/admin/audit` 的 client page；管理員顯示 audit table，技術員顯示明確無權限狀態，不以 client UI 取代 server RBAC。
  - 將 `/dashboard/settings` 改為只讀目前使用者與既有部署安全邊界頁；不產生設定寫入 API、表單或虛構健康資料。
- Out of scope: API、server、auth、RBAC、database schema、Ollama configuration、PLC／OPC UA、外部服務、設備控制與任何可寫 Settings。
- Done when: 兩種角色能看到 AI Copilot 與 Settings；管理員能看到實際 audit data，技術員有明確禁止狀態；AI response 顯示 server sources 與人員參考聲明，無法使用時不捏造答案。

## Preconditions

- Dependencies/evidence read: `evidence/phase-12.md`, Phase 04 AI/audit evidence, `PROJECT.md`, `ROADMAP.md`, `STATE.md`, `docs/ARCHITECTURE.md`, `docs/VALIDATION.md`.
- Existing contracts: `/api/auth/me` is authenticated for both roles; `/api/ai/advice` is authenticated for both roles and records audit events; `/api/admin/audit` remains server-side admin-only.

## Implementation steps

1. 新增共用 client presentation components/types for authenticated user, API error state, source labels and audit rows; reuse existing design-system `Card`、`Button`、`DataTable`、`PageHeader` and status primitives.
2. 實作 AI Copilot question form，僅將 user question POST 至既有 API；顯示 response `answer`、`sources` 和固定人員參考／無設備控制說明，並明確呈現 503 or other error。
3. 實作 Audit Log 管理員讀取與 table；對 403 顯示「僅限管理員」的不可寫狀態，保留後端 API 為唯一授權來源。
4. 實作 Settings 的 read-only account／deployment boundary cards，資料只來自 `/api/auth/me` 與固定的已實作 deployment facts；不放任何可寫 control。
5. 將三個 route page 連到對應 client component；新增 focused static/API contract tests，確認只呼叫既有 endpoints、沒有 API/schema/server change，並檢查 AI unavailable、source、admin-only audit 與 read-only wording。

## Test and verification plan

| Behaviour or risk | Test / check | Passing condition |
| --- | --- | --- |
| Existing contracts only | static page/component test and `git diff --name-only` review | only existing `/api/auth/me`、`/api/ai/advice`、`/api/admin/audit` are used; no route/server/schema changes |
| AI safety and sources | unit/static test plus browser technician scenario | advice displays sources and 「僅供人員參考」; unavailable result is explicit; no control UI exists |
| Audit authorization | admin/technician browser scenarios | administrator sees actual audit table; technician sees explicit 403 state, while server API remains 403 |
| Settings boundary | browser admin/technician scenario | current account and local deployment limits render without a writable setting |
| Baseline quality | `npm run lint`, `npm test`, `npm run typecheck`, `npm run build`, `git diff --check` | all exit 0 |
| Control state | `./check-harness.sh && ./check-run-state.sh` | exits 0 after evidence/control update |

## Recovery notes

- Do not alter Ollama endpoint, models, Compose networks, user credentials, database schema, or production data for this UI-only phase.
- If the local model is unavailable, retain the API's explicit unavailable state; do not add a cloud fallback or a fabricated response.
