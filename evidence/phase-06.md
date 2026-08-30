# Phase 06 Evidence — 人工現場作業與生產執行

Status: passed
Phase: 06
Acceptance criteria satisfied:
- AC-009
Base revision: 753cfdac848db206de2b4d616bb4b754cc1e4db2
Result revision: working tree (uncommitted)

## Outcome

管理員可為固定五線建立並指派人工現場作業；獲指派技術員可依有效生命週期回報開始、暫停、恢復與完成，並累計良／不良品與停機原因。未獲指派技術員不能回報，所有建立、指派與回報都留下作業歷程與管理員可見 audit。

## Changes

- 新增 AC-009、D002、Phase 06 plan，明確將 Phase 05 的 Docker 驗收保留為 release blocker，而非虛報通過。
- 新增 production task domain、in-memory／PostgreSQL store、`0003_production_execution.sql`、受 RBAC 保護的 API 與 dashboard 表單。
- 新增作業生命週期、數量驗證、越權拒絕、audit 與 migration tests。

## Verification

### Command / Check

Command: `npm run lint && npm run typecheck && npm test && npm run build && ./check-harness.sh && ./check-run-state.sh && git diff --check`
Result: passed; every command exited 0.
Observed: 17/17 tests passed. Build discovered both production-task API routes. Harness reported 9/9 AC coverage, Phase 06 as current during verification, and the unrelated Docker release blocker as present.

```text
✔ 管理員建立並指派人工現場作業；技術員只能查看自己的作業
✔ 只有獲指派技術員能依有效狀態回報，並累計產出、歷程與稽核
✔ 作業 API 拒絕未知產線、負數回報與未登入存取
✔ PostgreSQL migration 定義人工現場作業與不可變回報歷程
ℹ tests 17
ℹ pass 17
ℹ fail 0
✓ Compiled successfully
Harness starter is structurally complete.
Harness run state is valid.
Acceptance criteria: 9/9 covered
```

### User-observable check

Check: Built the local production app with `npm run build`, served it with `npm run start`, then used the dashboard as both roles.
Result: passed.
Observed: 管理員以 `admin` 建立並指派「組裝線首件巡檢」至 line-01；技術員以 `tech` 重新登入後只看到該作業，送出開始回報後畫面顯示 `in_progress`、累計良品 12／不良品 1，以及 `planned 0/0 → in_progress 12/1` 歷程。測試伺服器已停止。

### Safety boundary check

Check: `rg -n --glob '!node_modules' --glob '!.next' 'opcua|OPC UA|plc|device.*(write|control)|control.*device|https?://' src/app/api src/server src/domain`
Result: passed; command returned no matches for Phase 06 source.
Observed: Phase 06 未新增 OPC UA、PLC、設備寫入／控制或外部 HTTP 呼叫。

## Remaining risks

- PostgreSQL adapter 與 Docker Compose 的真實系統驗證仍屬 Phase 05／AC-008 blocker；本 phase 的 persistence contract 以 migration 與 in-memory adapter tests 驗證。
- Phase 06 不包含批次／序號追溯、品質不合格、庫存或自動排程；這些保持為 Phase 07 的待核准範圍。

## Next action

重新選擇 earliest uncompleted phase：Phase 05 仍因 Docker CLI 缺失而 blocked；Phase 07 雖依賴已滿足，但仍需要人員核准產品契約、AC 與 ADR。
