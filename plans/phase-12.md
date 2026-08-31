# Phase 12 Plan — Quality、Inspection 與 Traceability

## Goal and acceptance

- Goal: 將既有品質檢驗、不合格矯正、結案與批次／序號追溯 workflow 遷移到專屬 Quality 頁。
- Covers: AC-014
- In scope: existing quality-record、traceability、production-task API；管理員建立／結案、獲指派技術員矯正、批次追溯、RBAC error state。
- Out of scope: API/schema/auth/domain changes、庫存、隔離／報廢、條碼設備、PLC/OPC UA、外部資料服務。
- Done when: 專屬頁可完成既有品質 workflow 並保留 server-side RBAC；歷程與批次／序號可查。

## Verification

- `npm run lint && npm run typecheck && npm test && npm run build`
- 管理員建立／結案、技術員矯正、管理員批次追溯的 browser scenario。
- `./check-harness.sh && ./check-run-state.sh && git diff --check`；不變更 API/server/schema。

## Recovery

本 phase 僅改 client presentation；回復不影響品質或追溯資料。
