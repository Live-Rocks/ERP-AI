# Phase 07 Evidence — 品質不合格與批次／序號追溯

Status: passed
Phase: 07
Acceptance criteria satisfied:
- AC-010
Base revision: 753cfdac848db206de2b4d616bb4b754cc1e4db2
Result revision: working tree (uncommitted)

## Outcome

管理員可將檢驗結果與不合格紀錄連結至既有人工現場作業、固定產線及批次／序號；不合格需有缺陷描述。只有獲指派該作業的技術員可填寫矯正處置，管理員才能結案，並可按批次／序號取得關聯作業、品質紀錄及完整狀態歷程。建立、處置與結案皆寫入管理員可檢視的 audit。

## Changes

- 新增 AC-010、D003 與 Phase 07 plan，明確保留 Phase 05／AC-008 的 Docker Compose release blocker。
- 新增 quality domain、in-memory／PostgreSQL store、`0004_quality_traceability.sql`、RBAC API、批次追溯 API 與 dashboard 品質工作區。
- 新增不合格生命週期、缺陷描述、作業關聯、技術員越權拒絕、批次查詢、audit 與 migration tests。

## Verification

### Command / Check

Command: `npm run lint && npm run typecheck && npm test && npm run build && ./check-harness.sh && ./check-run-state.sh && git diff --check && ! rg -n --glob '!node_modules' --glob '!.next' 'opcua|OPC UA|plc|device.*(write|control)|control.*device|https?://' src/app/api src/server src/domain`
Result: passed; every command exited 0.
Observed: 21/21 tests passed; production build discovered `quality-records` and `traceability` routes. Harness reported 10/10 AC coverage, Phase 07 current during verification, and the unrelated Docker release blocker as present. The final static boundary check produced no matches.

```text
✔ 管理員建立不合格；只有獲指派技術員可矯正，管理員再結案
✔ 品質 API 要求缺陷描述、隱藏未指派資料，並提供管理員批次追溯與稽核
✔ 品質紀錄限制相同作業批次重複與不相符產線
✔ PostgreSQL migration 定義品質追溯、缺陷與不可變歷程
ℹ tests 21
ℹ pass 21
ℹ fail 0
✓ Compiled successfully
Harness starter is structurally complete.
Harness run state is valid.
Acceptance criteria: 10/10 covered
```

### User-observable check

Check: Built the local production app with `npm run build`, served it locally, then used the dashboard as both roles.
Result: passed.
Observed: 管理員建立並指派「品質追溯驗收作業」，再以 `LOT-PHASE07-001` 建立缺陷「首件尺寸超出公差」的不合格紀錄；技術員重新登入後填寫「調整治具後重新量測首件」。管理員重新登入，以該批次查到關聯作業與 `open → corrected` 歷程，按下結案後畫面顯示 `fail／closed`、矯正內容及 `open → corrected → closed`。管理員 audit 畫面同時顯示 `quality_record.created` 與 `quality_record.corrected`；自動 API 測試另確認 `quality_record.closed`。

## Remaining risks

- PostgreSQL adapter 與 Docker Compose 的真實系統驗證仍屬 Phase 05／AC-008 blocker；本 phase 的 persistence contract 以 migration 與 in-memory adapter tests 驗證。
- 正式品質資料保留年限、條碼設備、庫存／隔離／報廢帳務、排程與真實 OT 整合不在本 phase 範圍。

## Next action

重新選擇 earliest uncompleted phase：Phase 05 仍因 Docker CLI 缺失而 blocked。Phase 08 沒有產品契約 AC 或 OT 核准，維持 planned。
