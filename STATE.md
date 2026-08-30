# Harness State

## Run status

- State: `blocked` <!-- ready | planning | implementing | verifying | blocked | complete -->
- Current phase: `05`
- Last verified phase: `04`
- Next action: 在具 Docker Compose 的廠內或 CI 環境執行 `docker compose config`、`docker compose up --build -d` 與 Phase 05 smoke flow。

## Product-level acceptance

- [ ] PROJECT.md acceptance criteria are all covered and evidenced.

`STATE.md` is an operational view, not completion proof. `evidence/phase-XX.md` is the highest authority for whether a phase passed validation. A passing `check-run-state.sh` result only means the control state is internally consistent; it does not set this state to `complete` or prove product completion.

## Open blockers requiring a human decision

- 此工作區未安裝 Docker CLI（`docker: command not found`），因此無法執行 Compose config、建立容器或驗證 PostgreSQL／Ollama 的完整本機 stack。部署檔與應用 build 已完成；需要在具 Docker Compose 的環境重試，不需要任何 PLC、憑證或外網服務。

真實 PLC 的 OPC UA 端點、憑證與點位表不影響模擬版首發；在進行真實設備整合前，必須取得人員核准與必要資料。

## Latest handoff

2026-08-30 — 已依人員核准填寫 AI ERP 智慧工廠產品契約，定義 AC-001 至 AC-008，以及本機部署、資料不出廠與 AI 僅建議的安全邊界。已建立五個均為 `planned` 的 roadmap phase，且未開始 Phase 01 或建立任何 evidence。`./check-harness.sh` 與 `./check-run-state.sh` 均通過；下一步是在自主執行目標啟動後建立 `plans/phase-01.md`。

2026-08-30 — Phase 01 已通過並有 `evidence/phase-01.md`。本機 Next.js 基礎、角色登入與管理員 API 授權已建立；`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、`./check-harness.sh` 與 `./check-run-state.sh` 均通過。下一個可執行 phase 為 02。

2026-08-30 — Phase 02 已通過並有 `evidence/phase-02.md`。固定五線模擬監控、五秒更新、登入保護的 overview API、異常告警和去重待指派工單已建立；完整驗證組合通過。下一個可執行 phase 為 03。

2026-08-30 — Phase 03 與 Phase 04 已通過並有相應 evidence。工單的指派、處置、結案與歷程，以及帶來源引用的本機 AI 建議和管理員稽核檢視均已通過應用驗證。Phase 05 的 Dockerfile、Compose、health endpoint 與 operations 文件已完成；`npm run lint`、`npm run typecheck`、`npm test`（11/11）、`npm run build` 和 harness checks 通過，但 `docker compose config` 因 `docker: command not found` 無法執行。等待具 Docker Compose 的環境完成 AC-008 容器 smoke test。
