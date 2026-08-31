# Phase 10 Plan — Overview Dashboard

## Goal and acceptance

- Goal: 使用既有的本機 overview API 完成可操作、資料誠實的五線工廠總覽。
- Covers:
  - AC-012
- In scope: `/api/factory/overview` 的五秒輪詢、Output／Yield／Active Alerts KPI、session-only production trend（非持久化）、五條產線卡、active alerts、work-order 摘要、loading／error／empty presentation，以及 1920px、1440px、tablet 初步版面驗證。
- Out of scope: 新增或變更 API、schema、auth、RBAC、domain 邏輯；虛構 OEE／停機時間；PLC/OPC UA、設備控制、雲端服務；Work Order 操作 workflow（Phase 11）。
- Done when: 已登入使用者在 Overview 見到既有 API 的五線實際模擬資料與可追溯 alerts／work orders；Output、Yield 與 alerts 由 response 計算；OEE、Downtime 明確為「尚無資料」；trend 只標示為當前瀏覽器工作階段的觀測值。

## Preconditions

- Dependencies/evidence read: `evidence/phase-09.md`、PROJECT AC-012、D004、`ROADMAP.md`、`STATE.md`、`docs/VALIDATION.md`、`src/domain/factory.ts`、`/api/factory/overview`。
- Data contract: overview 回傳五條 `lines`、open `alerts`、`pendingWorkOrders`、`workOrderHistory` 與 `refreshedAt`。產線的 `producedUnits`、`rejectedUnits` 和 `lastUpdatedAt` 為可顯示資料；OEE／downtime 不在 contract 內。
- Assumptions: `Yield = producedUnits / (producedUnits + rejectedUnits)`，只能從目前 response 計算；production trend 只累積目前 browser tab 每次 API refresh 的 aggregate output sample，不稱為歷史生產資料。

## Implementation steps

1. 建立 Overview client data hook／view-model，保留既有 `/api/factory/overview` request、五秒 refresh、loading、error 和 unmount cleanup；不把資料寫回 server。
2. 將現有共用元件接進 KPI、trend chart、五線狀態、alerts 與 work orders；對 server 未提供的 OEE／Downtime 使用相同的不可用元件與清楚說明。
3. 新增 unit／UI regression test，驗證 KPI 和 Yield 計算、session trend 限制、line state mapping、資料缺口與 overview auth/API regression。
4. 在 desktop、laptop 和 tablet 的 production build 驗證資料載入、五秒更新和無假資料表示；更新 architecture、evidence 與控制檔。

## Test and verification plan

| Behaviour or risk | Test / check | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| Existing API / RBAC unchanged | regression | `npm test`; API route diff | existing overview auth and role tests pass; no API/server/schema change |
| Correct visual data derivation | unit/UI test | `npm test` | aggregate Output, Yield, alert count, state mapping and session-only trend have deterministic expectations |
| Production client safety | lint/type/build | `npm run lint && npm run typecheck && npm run build` | commands exit 0 |
| Dashboard user flow | browser scenario | admin and technician load Overview; desktop/laptop/tablet | five lines, metrics, alerts and work orders render; OEE/Downtime state is explicit; browser session trend is labelled |
| Harness consistency | control gates | `./check-harness.sh && ./check-run-state.sh && git diff --check` | commands exit 0; Phase 05 blocker remains recorded |

## Recovery notes

- Phase 10 is client-only: recovery restores the Phase 09 overview placeholder and removes its client presentation files without touching operational data.
- Do not present UI-hidden controls as authorization. Do not persist trend samples, derive OEE/downtime from invented data, or send data outside the browser and existing local API.
