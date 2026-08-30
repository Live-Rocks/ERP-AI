# Phase 02 Evidence — 五線模擬監控與告警

Status: passed
Phase: 02
Acceptance criteria satisfied:
- AC-002
- AC-003
Base revision: 753cfdac848db206de2b4d616bb4b754cc1e4db2
Result revision: working tree (uncommitted)

## Outcome

已登入的管理員及技術員可在 dashboard 同時查看固定五條產線。畫面每五秒讀取一次本機模擬 provider，呈現狀態、累計產量、不良品、最後更新時間和開放告警。新的模擬異常會建立一張待指派工單；同一 line/code 的未結案異常被去重。

## Changes

- 新增 `LineDataProvider`、五線 `SimulatedLineDataProvider` 與 factory store。
- 新增受登入保護的 `/api/factory/overview` 唯讀 API。
- 將 dashboard 置換為五線監控、異常及待指派工單視圖；更新 architecture 文件。

## Verification

### Command / Check

Command: `npm run lint && npm run typecheck && npm test && npm run build && ./check-harness.sh && ./check-run-state.sh && git diff --check`
Result: passed; every command exited 0.
Observed: 9/9 tests passed, including固定五線快照、五秒更新、告警去重建單與兩種角色對 overview API 的授權；Next.js production build and harness checks passed.

```text
✔ 模擬 provider 固定回傳五條產線，並以五秒快照更新
✔ 同一未結案模擬異常只建立一張待指派工單
✔ 產線 overview API 要求登入，但兩種角色皆可讀取
ℹ tests 9
ℹ pass 9
ℹ fail 0
✓ Compiled successfully
✓ Generating static pages (10/10)
Harness starter is structurally complete.
Harness run state is valid.
Acceptance criteria: 8/8 covered
Passed phases: 1
Current phase: 02
Blockers: none
```

## User-observable / system-observable verification

在 API integration test 中，未登入讀取 `/api/factory/overview` 收到 401；管理員與技術員 session 都收到五條產線。provider 在兩個相隔五秒的快照中更新時間不同，對持續異常仍只保有一筆 alert 與一張待指派工單。

## Remaining risks

- 模擬資料、告警與工單目前為記憶體示範資料；Phase 05 會將完整流程接上 PostgreSQL 與 Compose。
- 未與真實設備、PLC 或 OPC UA 通訊，符合首版唯讀與本機開發邊界。

## Next action

規劃並執行 Phase 03：維修工單處置流程。
