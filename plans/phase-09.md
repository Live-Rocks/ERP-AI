# Phase 09 Plan — 前端設計系統、Sidebar、Topbar 與 app shell

## Goal and acceptance

- Goal: 將已登入的單頁 dashboard 重構為深色、繁中、專業工業 SaaS shell，讓後續功能頁能一致地呈現既有 workflow。
- Covers:
  - AC-011
- In scope: Tailwind CSS v4、shadcn/ui、Lucide React、Recharts foundation；design token；Sidebar、Topbar、responsive app shell；全功能頁 route skeleton；`StatCard`、`StatusBadge`、`ProductionLineCard`、`AlertList`、`PageHeader`、`DataTable` shared components；既有登入導向與 logout control。
- Out of scope: 改動 API、database schema、authentication、RBAC、domain logic、PLC／OPC UA、外部服務、假造 KPI／Telemetry／Production Order 資料，以及 Phase 10 之後的完整頁面 workflow。
- Done when: 管理員與技術員登入後皆能使用 app shell 與功能導覽；不存在 API 的功能頁有清楚不可用狀態；共用元件、深色 token 與 tablet sidebar 行為可由後續 phase 重用。

## Preconditions

- Dependencies/evidence read: `evidence/phase-07.md`、PROJECT AC-011、D004、`ROADMAP.md`、`STATE.md`、`docs/VALIDATION.md`。
- Assumptions: `/dashboard` 保持 Overview route，以免更改登入後導向；dark theme 是第一版唯一主題；OEE、停機時長及沒有 API 的功能不產生模擬數值；所有 UI action 仍呼叫現有端點並接受其 server-side RBAC 結果。

## Implementation steps

1. 安裝 Tailwind v4 PostCSS、shadcn/ui supporting utilities、Lucide React 與 Recharts；建立 `components.json`、`src/lib/utils.ts` 與 CSS token，不加入任何 runtime cloud dependency。
2. 建立 shadcn primitives 與 reusable product components，統一深色工業 token、status semantics、loading／empty／error presentation 與 TypeScript props。
3. 重構 dashboard route 為 client-side app shell：既有 `/api/auth/me` 驗證、Sidebar navigation、Topbar user menu／logout、desktop sidebar 與 tablet sheet。
4. 增加各功能 route skeleton；可用功能顯示準備中的 page frame，沒有 API 的項目顯示 `資料介面尚未提供`，不新增 fetch 或 backend API。
5. 建立 UI regression checks，執行 baseline gates 與管理員／技術員 app shell browser scenario；更新 architecture、validation、evidence 與控制文件。

## Test and verification plan

| Behaviour or risk | Test / check | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| 不改 server contract | existing API tests and static diff review | `npm test`; API route inventory | existing auth, RBAC, factory, task and quality tests pass; no server/domain migration changed |
| Design-system TypeScript safety | lint/type/build | `npm run lint && npm run typecheck && npm run build` | commands exit 0 |
| Shell role flow | browser scenario | manager and technician sign in, navigate, log out | shell loads at `/dashboard`; navigation works; unauthorized actions remain absent or server-rejected |
| Responsive shell | browser scenario | desktop and tablet viewport | sidebar is persistent on desktop and uses accessible sheet navigation on tablet |
| Harness consistency | control gates | `./check-harness.sh && ./check-run-state.sh && git diff --check` | commands exit 0; Phase 05 blocker remains recorded |

## Recovery notes

- Tailwind and shadcn changes are client presentation dependencies only; recovery can restore the prior CSS and `/dashboard` component without touching operational data.
- Do not remove current API calls or use client hiding as an authorization control. Never run Docker, migrations, PLC tooling or external data integrations for this phase.
