# Phase 11 Plan — Work Orders、Production 與 Equipment status

## Goal and acceptance

- Goal: 將既有維修工單與人工現場作業 workflow 從舊單頁呈現重構為專屬 Work Orders／Production 頁；Equipment 頁只呈現可用的模擬 line status，並對 Telemetry、Maintenance 等無 API 項目維持明確不可用。
- Covers:
  - AC-013
- In scope: existing `/api/factory/overview`、`/api/work-orders/[id]`、`/api/production-tasks`、`/api/production-tasks/[id]`、`/api/admin/users` 的 client view；管理員指派、技術員處置／結案、管理員建立／指派 task、獲指派技術員作業回報、server error／role presentation；Equipment read-only status page。
- Out of scope: 新增 API、schema、auth／RBAC／domain 邏輯；Production Orders backend、Telemetry history、Maintenance records、PLC／OPC UA、設備寫入；自動排程或捏造資料。
- Done when: 原有已驗證的 work-order／production-task 操作可由專屬頁完成並保留 server-side RBAC；沒有 API 的 Production Orders／Telemetry／Maintenance 顯示明確不可用。

## Preconditions

- Dependencies/evidence read: `evidence/phase-10.md`、PROJECT AC-013、D004、`ROADMAP.md`、`STATE.md`、`docs/VALIDATION.md`；work-order、execution domain 與 API route contracts。
- Data contract: overview 提供 work-order summary 與 lines；task list／create API 提供既有人工現場作業；task PATCH 接受既有 `report` action；work-order PATCH 接受既有 `assign`／`resolve` action；admin users API 提供可指派技術員。
- Assumptions: client 只能依 role 顯示適用 action，所有 mutation outcome 仍由 server-side RBAC 與既有狀態機決定；Equipment 只讀取目前 overview snapshot。

## Implementation steps

1. 建立 shared operational data hook、role-aware forms／table components與可測試的 view-model，不改現有 API request/response。
2. 在 Work Orders 實作列表、管理員指派與獲指派技術員結案；在 Production 實作 task 建立／指派及技術員回報。
3. 實作 Equipment 的五線模擬狀態與 Telemetry／Maintenance 不可用區塊；Production Orders 也以相同資料誠實狀態呈現。
4. 新增 mutation、角色呈現、空狀態與不可用狀態 regression tests；以兩角色 browser flows 驗證並更新 architecture/evidence/control state。

## Test and verification plan

| Behaviour or risk | Test / check | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| Existing RBAC / status machine | API regression | `npm test` | existing work-order and production task role/state tests pass |
| Correct client request mapping | unit/UI test | `npm test` | assign, resolve, task create/report payloads only use existing actions and role UI does not claim authorization |
| No fabricated interfaces | static/UI test | `npm test`; browser | Production Orders, Telemetry and Maintenance state explicitly say API unavailable |
| Compiled UI | baseline | `npm run lint && npm run typecheck && npm run build` | commands exit 0 |
| User flows | browser scenario | manager assignment/create; assigned technician report/resolve; desktop/tablet status view | actions refresh existing data and response errors remain visible |
| Harness consistency | control gates | `./check-harness.sh && ./check-run-state.sh && git diff --check` | commands exit 0; Phase 05 blocker remains recorded |

## Recovery notes

- Phase 11 is client-only. Reverting it restores Phase 10 page shells without touching persisted operational data.
- Never expose a fake equipment write, maintenance completion, production order or telemetry history control. UI hiding is not authorization.
