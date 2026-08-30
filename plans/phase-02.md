# Phase 02 Plan — 五線模擬監控與告警

## Goal and acceptance

- Goal: 交付不依賴 PLC 的五線模擬監控、每五秒更新的儀表板與具去重機制的異常告警／待指派工單。
- Covers:
  - AC-002
  - AC-003
- In scope: `LineDataProvider` 介面、確定性五線模擬 provider、產線與告警 repository、告警自動建立待指派工單、監控與詳情 UI、受保護讀取 API。
- Out of scope: 真實 OPC UA、設備控制、工單指派或結案、AI、外部通知。
- Done when: 管理員及技術員登入後可看到五條產線與狀態、生產／異常資料和最後更新時間；畫面每五秒重新取得資料；同一未結案異常只保有一張待指派工單。

## Preconditions

- Dependencies/evidence read: evidence/phase-01.md、PROJECT.md、ROADMAP.md、STATE.md、docs/VALIDATION.md、docs/ARCHITECTURE.md。
- Assumptions: 模擬資料與告警／待指派工單為記憶體示範資料，並透過 repository 邊界保留後續 PostgreSQL 取代空間；模擬資料 provider 不提供任何 PLC 寫入介面。

## Implementation steps

1. 定義產線、遙測、告警、待指派工單與 `LineDataProvider` 型別。
2. 實作固定五線的確定性模擬 provider，依時間窗每五秒產生快照，並在異常狀態建立告警。
3. 實作告警去重與待指派工單建立；新增受登入保護的產線與告警讀取 API。
4. 將 dashboard 改為五線儀表板，顯示單線詳情及可見告警，並每五秒更新。
5. 新增 provider、告警去重、API 授權和 dashboard 資料契約測試，更新 architecture。

## Test and verification plan

| Behaviour or risk | Test / check | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| 固定五線與五秒快照 | provider 單元測試 | `npm test` | 產生 5 條有狀態、產量、異常資訊與最後更新時間的產線 |
| 告警與去重建單 | repository 整合測試 | `npm test` | 新異常建立一筆告警與待指派工單；同一未結案 key 不重複建立 |
| 存取邊界 | route 測試 | `npm test` | 未登入不能讀取產線；兩種登入角色均可讀取 |
| 可編譯 UI | 靜態與 production build | `npm run lint`、`npm run typecheck`、`npm run build` | exits 0 |
| 控制文件一致性 | harness 檢查 | `./check-harness.sh`、`./check-run-state.sh` | exits 0 |

## Recovery notes

- 模擬 provider、alerts 與待指派工單全部為本機示範資料，移除新增模組即可回到 Phase 01。
- 告警去重失敗時，以相同 `lineId` 與 `code` 的連續 provider 呼叫重現，修正後重跑所有測試。
