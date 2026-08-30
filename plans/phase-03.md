# Phase 03 Plan — 維修工單處置流程

## Goal and acceptance

- Goal: 將 Phase 02 的待指派工單變成具角色授權、處置紀錄與結案歷程的維修流程。
- Covers:
  - AC-004
- In scope: 管理員指派、技術員更新處置及結案、狀態歷程、受保護 API 和 dashboard 操作。
- Out of scope: 自動派工、設備控制、AI、外部通知。
- Done when: 管理員可指派技術員，技術員可新增處置並結案，且每項狀態變更可在工單上檢視。

## Preconditions

- Dependencies/evidence read: evidence/phase-02.md、PROJECT.md、ROADMAP.md、STATE.md、docs/VALIDATION.md、docs/ARCHITECTURE.md。
- Assumptions: 工單仍為本機示範資料，但以明確的狀態轉換守護未來 PostgreSQL 持久化。

## Implementation steps

1. 擴充工單模型、狀態轉換與歷程資料。
2. 實作管理員指派和技術員處置／結案 API，於 server 強制角色規則。
3. 在 dashboard 呈現及操作待指派、處理中與已結案工單。
4. 新增狀態轉換、授權與歷程測試，更新 architecture。

## Test and verification plan

| Behaviour or risk | Test / check | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| 角色與狀態轉換 | API/service tests | `npm test` | 只有管理員可指派；只有指派技術員可處置或結案；歷程完整 |
| 編譯與靜態檢查 | type/build | `npm run lint`、`npm run typecheck`、`npm run build` | exits 0 |
| 控制文件 | harness | `./check-harness.sh`、`./check-run-state.sh` | exits 0 |

## Recovery notes

- 變更僅影響本機示範資料；若狀態轉換錯誤，以 service tests 重現並回復未結案工單資料。
