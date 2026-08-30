# Phase 04 Evidence — 本機 AI 建議與完整稽核

Status: passed
Phase: 04
Acceptance criteria satisfied:
- AC-005
- AC-006
- AC-007
Base revision: 753cfdac848db206de2b4d616bb4b754cc1e4db2
Result revision: working tree (uncommitted)

## Outcome

已登入使用者可在 dashboard 提問並獲得繁中本機排障建議及 SOP、alert、work-order 來源。建議明確標示僅供人員參考，沒有設備控制或外網呼叫。管理員可查看登入、告警、工單及 AI 問答的稽核紀錄。

## Changes

- 新增內建 SOP、唯讀本機 retrieval 建議 service 及 AI advice API/UI。
- 新增活動 audit log 與僅限管理員讀取的 audit API/UI。
- 對登入、告警、工單指派／結案與 AI 問答記錄 audit event。

## Verification

### Command / Check

Command: `npm run lint && npm test && npm run build && ./check-harness.sh && ./check-run-state.sh && git diff --check`
Result: passed; every command exited 0.
Observed: 11/11 tests passed. Fixed AI case returned SOP, alert and work-order sources; technician audit access was rejected; Next.js build and harness checks passed.

```text
✔ 本機 AI 建議引用 SOP、告警與工單，且寫入 audit
ℹ tests 11
ℹ pass 11
ℹ fail 0
✓ Compiled successfully
Harness starter is structurally complete.
Harness run state is valid.
Acceptance criteria: 8/8 covered
Passed phases: 3
Current phase: 04
Blockers: none
```

## User-observable / system-observable verification

dashboard 提供「本機 AI 排障建議」問題表單、帶來源的回答及管理員稽核清單。API test 實際驗證來源包含 SOP、alert、work order，且 audit API 對技術員回傳 403。

## Remaining risks

- Compose phase 將提供 Ollama runtime；目前使用可重現的本機 retrieval reply，沒有外部模型呼叫。
- audit 與 operational data 尚待 Phase 05 持久化至 PostgreSQL。

## Next action

規劃並執行 Phase 05：廠內部署與全流程驗收。
