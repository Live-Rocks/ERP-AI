# Autonomous Codex Harness

這是一個讓 Codex 跨越多個 phase 自主推進的工作區模板。

它的控制迴圈是：

```text
選擇下一個可執行 phase → 規劃 → 實作 → 驗證 → 記錄證據 → 選擇下一個 phase
```

Phase 的完成不是暫停訊號。只有整個產品完成，或碰到 `AGENTS.md` 定義的阻塞條件時，Codex 才應停下來。

## 開始使用

1. 把你的產品需求填入 `PROJECT.md`。
2. 請 Codex 依據該需求填寫 `ROADMAP.md`；每個 phase 都要有依賴、完成條件與驗證方式。
3. 在 Codex 輸入 `START_GOAL.md` 裡的 `/goal` 範本，替換方括號內容後送出。
4. 用 `/goal` 查看進度。完成 phase 後，Codex 會自行選擇下一個可執行 phase，而不是等待核准。
5. 每個 checkpoint 執行 `./check-harness.sh` 與 `./check-run-state.sh`。後者檢查 AC coverage、phase 依賴、evidence 與 completion claim 是否一致。

不要把這個目錄當成產品程式碼本身；它是產品 repo 旁或 repo 內的工作控制層。

## 文件角色

- `PROJECT.md`：不可輕易改動的產品契約。
- `ROADMAP.md`：phase 佇列與依賴圖。
- `STATE.md`：此刻的真實進度，供中斷後恢復。
- `plans/`：每個 phase 的行動計畫。
- `evidence/`：每個 phase 的驗收證據。
- `AGENTS.md`：Codex 的自動推進與安全規則。
- `docs/ARCHITECTURE.md`：已實作的系統邊界、資料流與關鍵契約；不是願望清單。
- `docs/DECISIONS.md`：會改變架構、資料治理、產品邊界或可驗證主張的 ADR。
- `docs/VALIDATION.md`：跨 phase 共用的測試與驗證 gate。

`PROJECT.md` 管產品意圖與 AC；`ROADMAP.md` 管計畫與 coverage；`STATE.md` 管目前執行位置；`evidence/` 才是 phase 是否真的通過的最高證據來源。

`docs/OPERATIONS.md` 僅在專案有部署、排程、外部服務或機密時才建立。模型／資料／研究型專案則在需要時新增 `docs/DATA_CONTRACT.md` 與 `docs/EXPERIMENTS.md`；不要為了完整感而預先建立它們。
