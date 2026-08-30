# Phase 03 Evidence — 維修工單處置流程

Status: passed
Phase: 03
Acceptance criteria satisfied:
- AC-004
Base revision: 753cfdac848db206de2b4d616bb4b754cc1e4db2
Result revision: working tree (uncommitted)

## Outcome

管理員可從 dashboard 指派待指派工單給設備技術員；被指派技術員可提交處置並結案。工單保留建立、指派與結案歷程，server-side API 強制角色及指派限制。

## Changes

- 擴充工單狀態、指派、處置與歷程模型。
- 新增 `/api/work-orders/[id]` PATCH 及 dashboard 指派／結案操作。
- 新增授權與狀態轉換測試，更新 architecture。

## Verification

### Command / Check

Command: `npm run lint && npm test && npm run build && ./check-harness.sh && ./check-run-state.sh && git diff --check`
Result: passed; every command exited 0.
Observed: 10/10 tests passed, including管理員指派、僅被指派技術員結案與三筆狀態歷程；production build and harness checks passed.

```text
✔ 管理員指派後，只有被指派技術員可記錄處置並結案，且保留歷程
ℹ tests 10
ℹ pass 10
ℹ fail 0
✓ Compiled successfully
Harness starter is structurally complete.
Harness run state is valid.
Acceptance criteria: 8/8 covered
Passed phases: 2
Current phase: 03
Blockers: none
```

## User-observable / system-observable verification

dashboard 對管理員顯示「指派設備技術員」，對已指派技術員顯示「完成處置並結案」。API test 實際完成指派與結案，並驗證工單歷程含建立、指派及結案三筆事件。

## Remaining risks

- 工單仍採用本機示範 repository；持久化留待本機部署 phase。

## Next action

規劃並執行 Phase 04：本機 AI 建議與完整稽核。
