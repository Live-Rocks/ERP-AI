# Phase 10 Evidence — Overview Dashboard

Status: passed
Phase: 10
Acceptance criteria satisfied:
- AC-012
Base revision: e056bf93b954403274cd87ece1fa5f713b1df457
Result revision: working tree (uncommitted)

## Outcome

Overview Dashboard 已使用既有 `/api/factory/overview` 顯示 Output、Yield、Active Alerts、五條固定產線、active alerts、工單摘要與 browser-session-only 的 production trend。資料每五秒重新讀取；OEE 與 Downtime 因 API 沒有可驗證來源，固定顯示不可用，而非使用假值。

## Changes

- 新增可測試的 overview view-model，從既有 line、alert 和 work-order response 推導 aggregate Output、Yield、alert count、中文狀態與 bounded session trend。
- 新增 client Overview dashboard、Recharts production trend、五線卡、alert list、work-order table、loading/error state，以及資料來源／缺口說明。
- 新增 deterministic KPI、trend 去重／上限及狀態文字測試；將 raw API severity 呈現為繁中「緊急／警示」。

## Verification

### Command / Check

Command: `npm run lint && npm run typecheck && npm test && npm run build && ./check-harness.sh && ./check-run-state.sh && git diff --check && git diff --name-only e056bf9 -- src/app/api src/server db`
Result: passed; all commands exited 0, and the final API/server/schema diff command produced no output.
Observed: 26/26 automated tests passed. Build rendered `/dashboard` with the Recharts client bundle and preserved all existing API routes. Harness remained structurally valid; Phase 05 Docker Compose was still the only release blocker.

```text
✔ Overview KPI 僅由既有 API 的產出、不良品與告警推導
✔ production trend 僅保留目前 session 的去重且有上限觀測值
✔ 產線與工單狀態會有不依賴顏色的中文文字
ℹ tests 26
ℹ pass 26
ℹ fail 0
✓ Compiled successfully
Harness starter is structurally complete.
Harness run state is valid.
```

### User-observable check

Check: Served the built local standalone app with the Dockerfile-equivalent static asset layout, then loaded Overview as the existing technician demo session on `127.0.0.1`.
Result: passed.
Observed: 實際畫面顯示五條產線、Output、Yield、1 個 active alert、告警建立的待指派工單、繁中「緊急」嚴重度與 Recharts trend。等待超過五秒後，最後更新時間及 trend 增加新的 session observation。1440px 下五條線和 trend 均可用；768px 下仍顯示五條線和主導覽 trigger。OEE 與 Downtime 各顯示一次「尚無可驗證的…資料來源」，沒有數字值。Phase 09 的管理員實際 shell 驗證與既有 overview API role regression 共同確認兩個角色的既有存取不變。

## Remaining risks

- `SimulatedLineDataProvider` 以時間 bucket 產生既有累計數字；UI 忠實顯示 API response，不重新定義 simulator 或 domain 計數。
- OEE 與停機時長需要未來經核准的資料 contract；不得由目前 line snapshot 猜測。
- Phase 05／AC-008 的 Docker Compose 實境驗收仍缺 Docker CLI。

## Next action

Phase 11 是下一個符合依賴條件的 UI phase：將既有 work-order 和 production-task workflow 移至專屬頁，並將 Equipment 的缺少 API 項目標示為不可用。
