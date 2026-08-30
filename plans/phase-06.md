# Phase 06 Plan — 人工現場作業與生產執行

## Goal and acceptance

- Goal: 在固定五條模擬產線上建立受角色保護、可稽核的人工現場作業閉環。
- Covers:
  - AC-009
- In scope: 管理員建立與指派作業；技術員對自己獲指派作業回報開始、暫停、完成、良品／不良品與選填停機原因；資料模型、PostgreSQL migration、in-memory adapter、API、dashboard UI 與 audit。
- Out of scope: 自動排程／自動派工、PLC／OPC UA、設備控制、外部通知、庫存扣帳、批次／序號追溯與雲端服務。
- Done when: AC-009 的作業建立、指派、回報、拒絕越權、歷程及管理員 audit 都通過自動測試與 dashboard 情境。

## Preconditions

- Dependencies/evidence read: `evidence/phase-04.md`、`PROJECT.md` AC-009、D002、`ROADMAP.md` 與 `STATE.md`。
- Assumptions: 固定五線都可手動建立作業；管理員可指派給既有技術員；良品與不良品是非負整數；停機原因為選填繁中自由文字。

## Implementation steps

1. 定義作業、狀態歷程與回報領域模型，限制有效狀態轉換。
2. 擴充 in-memory 與 PostgreSQL adapter，持久化作業、回報和不可變歷程，並把狀態變更與 audit 同交易寫入。
3. 新增受 RBAC 保護的作業 API：管理員建立／指派，獲指派技術員回報。
4. 在 dashboard 提供管理員建立／指派與技術員回報的最小可用 UI，顯示目前作業與歷程。
5. 新增 API、狀態與 audit tests；執行 baseline gates，並更新架構與 evidence。

## Test and verification plan

| Behaviour or risk | Test / check | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| 作業有效生命週期 | domain/store unit tests | `npm test` | 僅允許 planned → in_progress → paused/in_progress → completed；回報數值不可為負 |
| RBAC 與指派 | route integration tests | `npm test` | 僅管理員可建立／指派，只有獲指派技術員可回報 |
| 稽核與歷程 | API integration test | `npm test` | create、assign、每次 report 都可被管理員 audit 與作業 history 讀取 |
| 無 OT／雲端擴張 | static boundary check | `rg` plus tests | 不新增 PLC/OPC UA write、設備控制或 external fetch |
| Type/build/control | baseline gates | `npm run lint && npm run typecheck && npm test && npm run build && ./check-harness.sh && ./check-run-state.sh` | commands exit 0 |

## Recovery notes

- 資料庫 migration 只新增新資料表；回復程式可停止使用作業 API，不刪除既有歷程。
- 不要對含有廠內紀錄的 PostgreSQL volume 使用 `docker compose down -v`；依 operations backup 流程處理。
