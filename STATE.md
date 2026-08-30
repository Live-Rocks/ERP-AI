# Harness State

## Run status

- State: `blocked` <!-- ready | planning | implementing | verifying | blocked | complete -->
- Current phase: `05`
- Last verified phase: `07`
- Next action: 在具 Docker Compose 的廠內或 CI 環境執行 `docker compose config`、`docker compose up --build -d` 與 Phase 05 的 PostgreSQL／Ollama end-to-end smoke flow。Phase 08 仍需人員核准產品契約、OT safety ADR、端點、read-only 憑證與點位表。

## Product-level acceptance

- [ ] PROJECT.md acceptance criteria are all covered and evidenced.

`STATE.md` is an operational view, not completion proof. `evidence/phase-XX.md` is the highest authority for whether a phase passed validation. A passing `check-run-state.sh` result only means the control state is internally consistent; it does not set this state to `complete` or prove product completion.

## Open blockers requiring a human decision

- Phase 05：此工作區未安裝 Docker CLI（`docker: command not found`），因此無法執行 Compose config、建立容器或驗證 PostgreSQL／Ollama 的完整本機 stack。D002 允許 Phase 06 先行，但 AC-008 仍未通過且是 release blocker；最終仍需要在具 Docker Compose 的環境重試，不需要任何 PLC、憑證或外網服務。

真實 PLC 的 OPC UA 端點、憑證與點位表不影響模擬版首發；在進行真實設備整合前，必須取得人員核准與必要資料。

## Latest handoff

2026-08-30 — 已依人員核准填寫 AI ERP 智慧工廠產品契約，定義 AC-001 至 AC-008，以及本機部署、資料不出廠與 AI 僅建議的安全邊界。已建立五個均為 `planned` 的 roadmap phase，且未開始 Phase 01 或建立任何 evidence。`./check-harness.sh` 與 `./check-run-state.sh` 均通過；下一步是在自主執行目標啟動後建立 `plans/phase-01.md`。

2026-08-30 — Phase 01 已通過並有 `evidence/phase-01.md`。本機 Next.js 基礎、角色登入與管理員 API 授權已建立；`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、`./check-harness.sh` 與 `./check-run-state.sh` 均通過。下一個可執行 phase 為 02。

2026-08-30 — Phase 02 已通過並有 `evidence/phase-02.md`。固定五線模擬監控、五秒更新、登入保護的 overview API、異常告警和去重待指派工單已建立；完整驗證組合通過。下一個可執行 phase 為 03。

2026-08-30 — Phase 03 與 Phase 04 已通過並有相應 evidence。工單的指派、處置、結案與歷程，以及帶來源引用的本機 AI 建議和管理員稽核檢視均已通過應用驗證。Phase 05 的 Dockerfile、Compose、health endpoint 與 operations 文件已完成；`npm run lint`、`npm run typecheck`、`npm test`（11/11）、`npm run build` 和 harness checks 通過，但 `docker compose config` 因 `docker: command not found` 無法執行。等待具 Docker Compose 的環境完成 AC-008 容器 smoke test。

2026-08-30 — Phase 05 已補齊正式 runtime 的 PostgreSQL adapter（使用者、audit、五線快照、alerts、work orders 與 history）與只允許廠內 endpoint 的 Ollama client，並新增初始本機帳號與預載模型設定。`npm run lint`、`npm test`（13/13）、`npm run build`、`./check-harness.sh`、`./check-run-state.sh` 與 `git diff --check` 通過；`docker compose config` 仍因 `docker: command not found` 無法執行，因此沒有建立 Phase 05 passing evidence，AC-005 至 AC-008 的實境 runtime 驗證仍待具 Docker Compose 的環境完成。

2026-08-30 — 已將 PostgreSQL runtime 的告警建單、工單指派／結案與相應 audit 寫入改為同一交易，避免半完成的營運紀錄。`npm run lint`、`npm test`（13/13）、`npm run build` 與兩個 harness checks 再次通過。Docker CLI 仍不存在；這些 adapter-level 結果不構成 Phase 05 passing evidence。

2026-08-30 — 依人員要求在 ROADMAP 新增條件式 Phase 06–08：人工現場作業與生產執行、品質不合格與批次／序號追溯、唯讀 OPC UA 資料整合。三者不覆蓋首版 AC，且都必須先完成首版、取得人員核准的產品契約／ADR 與（Phase 08）OT 端點、憑證、點位表與網路核准；目前不改變 Phase 05 blocker 或首版範圍。

2026-08-30 — 人員核准以 D002 延後（不是通過）Phase 05 的 Docker Compose 驗收，先執行 Phase 06。PROJECT 新增 AC-009 的人工現場作業垂直切片；Phase 06 依賴 Phase 04 evidence 並進入 implementing。AC-008 與 Phase 05 保持未通過的 release blocker。

2026-08-30 — Phase 06 已通過並有 `evidence/phase-06.md`。AC-009 的人工現場作業建立、指派、技術員回報、越權拒絕、數量／狀態驗證、歷程與 audit 都已通過 17/17 自動測試與 production-server dashboard 情境。重新選擇後，Phase 05 仍是 earliest uncompleted phase，因缺 Docker CLI 而 blocked；Phase 07 也仍待人員核准範圍。

2026-08-30 — 人員明確核准啟動 Phase 07。PROJECT 新增 AC-010，D003 記錄品質不合格與批次／序號追溯的資料治理與安全邊界；Phase 07 依賴已通過的 Phase 06 evidence 並進入 implementing。Phase 05／AC-008 的 Docker Compose release blocker 保持不變。

2026-08-30 — Phase 07 已通過並有 `evidence/phase-07.md`。AC-010 的檢驗結果、不合格缺陷、獲指派技術員矯正、管理員結案、批次／序號追溯、不可變歷程與 audit 均通過 21/21 自動測試與 production-server dashboard 情境。重新選擇後，Phase 05 仍是 earliest uncompleted phase，且因缺 Docker CLI 而 blocked；Phase 08 沒有產品契約 AC 與 OT 核准。
