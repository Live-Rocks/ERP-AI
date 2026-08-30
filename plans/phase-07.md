# Phase 07 Plan — 品質不合格與批次／序號追溯

## Goal and acceptance

- Goal: 在既有人工現場作業上建立可稽核的不合格處置與批次／序號追溯閉環。
- Covers:
  - AC-010
- In scope: 管理員建立連結作業、固定產線與唯一批次／序號的檢驗結果；不合格缺陷描述；獲指派技術員的矯正處置；管理員結案；依批次／序號查詢關聯作業、品質紀錄與不可變歷程；PostgreSQL migration、in-memory adapter、API、dashboard UI 與 audit。
- Out of scope: 庫存異動、隔離／報廢帳務、排程、條碼設備、PLC／OPC UA、設備控制、外部通知與雲端服務。
- Done when: AC-010 的建立、技術員越權拒絕、矯正處置、管理員結案、批次查詢、歷程與 audit 都通過自動測試與 dashboard 情境。

## Preconditions

- Dependencies/evidence read: `evidence/phase-06.md`、`PROJECT.md` AC-010、D003、`ROADMAP.md`、`STATE.md` 與 `docs/VALIDATION.md`。
- Assumptions: 批次／序號由管理員輸入且在同一人工現場作業內唯一；通過檢驗直接結案，不合格依 `open → corrected → closed` 處理；正式保留年限待廠內品質責任人另行決定，首版沒有刪除 API。

## Implementation steps

1. 定義品質紀錄、檢驗結果與不可變處置歷程領域模型，限制不合格狀態轉換。
2. 擴充 in-memory 與 PostgreSQL adapter，持久化品質紀錄、歷程與對應 audit，並建立批次／序號索引。
3. 新增受 RBAC 保護的品質 API：管理員建立／結案、獲指派技術員矯正，以及管理員批次追溯查詢。
4. 在 dashboard 提供管理員建立／查詢／結案與技術員矯正處置的最小可用 UI，顯示批次關聯與歷程。
5. 新增 API、狀態、RBAC、trace 與 audit tests；執行 baseline gates，更新架構、README、evidence 與控制文件。

## Test and verification plan

| Behaviour or risk | Test / check | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| 不合格生命週期 | domain/store unit tests | `npm test` | 不合格只允許 open → corrected → closed；無矯正處置不可結案 |
| RBAC 與作業關聯 | route integration tests | `npm test` | 僅管理員可建立／結案；只有獲指派該作業的技術員可矯正 |
| 批次／序號追溯與稽核 | API integration test | `npm test` | 管理員可依批次／序號取得作業、品質紀錄與不可變歷程，且建立／處置／結案皆有 audit |
| 無 OT／雲端擴張 | static boundary check | `rg` plus tests | 不新增 PLC/OPC UA write、設備控制或 external fetch |
| Type/build/control | baseline gates | `npm run lint && npm run typecheck && npm test && npm run build && ./check-harness.sh && ./check-run-state.sh` | commands exit 0 |

## Recovery notes

- 資料庫 migration 只新增品質與追溯資料表及索引；回復程式可停止使用品質 API，不刪除既有紀錄。
- 不要對含有廠內紀錄的 PostgreSQL volume 使用 `docker compose down -v`；依 operations backup 流程處理。
