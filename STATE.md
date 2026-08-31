# Harness State

## Run status

- State: `blocked` <!-- ready | planning | implementing | verifying | blocked | complete -->
- Current phase: `08`
- Last verified phase: `14`
- Next action: Phase 14 已通過。下一個未完成項是條件式 Phase 08；只有在人員核准 OT 連線 ADR、提供測試／生產端點、唯讀帳號或憑證、點位表、網路區隔與變更窗口後，才可建立 plan 並開始唯讀 OPC UA 整合。

## Product-level acceptance

- [x] PROJECT.md acceptance criteria are all covered and evidenced.

`STATE.md` is an operational view, not completion proof. `evidence/phase-XX.md` is the highest authority for whether a phase passed validation. A passing `check-run-state.sh` result only means the control state is internally consistent; it does not set this state to `complete` or prove product completion.

## Open blockers requiring a human decision

- Phase 08：需要人員核准 OT 連線 ADR，並提供已核准的測試／生產端點、唯讀帳號或憑證、點位表、網路區隔與變更窗口。未取得這些資料前，不連接或掃描任何 PLC／OPC UA endpoint。

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

2026-08-31 — 人員核准 D004 的前端 Industrial SaaS／MES 重構。PROJECT 新增 AC-011 至 AC-016；Phase 09–14 可依賴 Phase 07 evidence 執行，而 Phase 05／AC-008 的 Docker Compose release blocker 保持不變。Phase 09 已進入 implementing；Phase 08 仍需獨立 OT 核准。

2026-08-31 — Phase 09 已通過並有 `evidence/phase-09.md`。Tailwind／shadcn／Lucide／Recharts foundation、深色 industrial design system、Sidebar、Topbar、tablet Sheet、八個功能 route skeleton 與 reusable components 已建立；管理員與技術員在 built local app 的 app shell／導覽／登出情境已通過，且確認沒有 API、server 或 schema 變更。下一個可執行 phase 為 10；Phase 05 的 Docker Compose release blocker 維持不變。

2026-08-31 — Phase 10 已通過並有 `evidence/phase-10.md`。Overview 使用既有本機 API 顯示 Output、Yield、alerts、五線與工單摘要；Recharts trend 限於 browser session，OEE／Downtime 明確不可用。26/26 tests、typecheck、build、desktop／laptop／tablet browser checks 與 harness checks 均通過，且沒有 API、server 或 schema 變更。下一個可執行 phase 為 11；Phase 05 的 Docker Compose release blocker 維持不變。

2026-08-31 — Phase 11 已通過並有 `evidence/phase-11.md`。Work Orders、Production、Equipment 專屬頁保留既有 API／server RBAC；管理員建立／指派作業和指派工單、技術員回報／結案均在 built local app 通過。Production Orders、Telemetry、Maintenance 明確不可用。27/27 tests、typecheck、build 與 browser flow 通過；Phase 05 blocker 維持不變。

2026-08-31 — 人員指示在 Phase 11 後暫停。Phase 12 維持 `planned`；沒有執行其產品實作或建立 passing evidence。下次須取得人員明確指示才可開始。

2026-08-31 — 依人員授權在 macOS 13.4.1 Apple Silicon Mac 安裝 Homebrew、Colima 0.10.3、Docker CLI 29.7.2 與 Docker Compose 5.5.0。隔離 profile `erp-ai-phase12` 已以 2 CPU／4GiB RAM／30GiB disk 運行，Compose config 驗證列出 app、postgres、ollama 三服務。Docker Hub 的 `ollama/ollama:latest` 大型 image layer 兩次拉取都停滯，僅留下 480.6MB 可恢復暫存，故未建立 container、volume 以外的模型資料，也不能執行 Compose smoke 或 Phase 12 browser flow。Phase 05 保持 blocked；需可用 registry／proxy 或已核准內部 mirror。

2026-08-31 — Phase 05 與 Phase 12 已在全新隔離的 Colima／Docker Compose runtime 通過並有 passing evidence。預載 `qwen2.5:1.5b` 後，app、PostgreSQL 與 Ollama 可在同一 local project 啟動；app 只綁定 `127.0.0.1:3000`，PostgreSQL healthy，Ollama 沒有 host port。實境驗收修正 app ingress／internal factory network 與 Next.js listener，並以 `0005_line_snapshot_bigint.sql` 對測試 volume 安全升級模擬累計 counters。管理員／技術員登入、五線、告警工單指派／結案、帶來源的本機 AI 建議、稽核、品質不合格矯正結案與 `P12-TRACE-001` 追溯都通過；29/29 tests、lint、typecheck、build、harness checks 與 `git diff --check` 均通過。下一個 eligible phase 為 13；Phase 08 仍待人員 OT 核准。

2026-08-31 — Phase 13 已通過並有 `evidence/phase-13.md`；AI Copilot、Audit Log 與唯讀 Settings 已在隔離 Compose runtime browser flow 通過。Phase 14 已加入 keyboard skip path、main landmark、loading status 與 responsive／semantic static regression；33/33 tests、lint、typecheck、build 與 `git diff --check` 通過。既有 evidence 已觀察 1440px／768px，Phase 14 在 541px 亦確認無水平溢位、mobile navigation 及 skip-to-main 操作，但目前 browser surface 無法設定 1920px viewport，因此 AC-016 尚未有完整 passing evidence，Phase 14 保持 blocked。

2026-08-31 — 使用者回報 Compose runtime 的登入頁誤導地預填 `admin / admin-demo`。已移除預填與錯誤示範帳密提示，改為說明空白 PostgreSQL volume 首次初始化使用 `.env` 的 `INITIAL_*` 值、既有 volume 不會自動重設帳密，並將 `admin-demo` 僅限未設定 `DATABASE_URL` 的開發模式。README、operations、architecture 與 roadmap 已完成同一現況對齊；`.dockerignore` 排除 `.env`、`node_modules` 與 `.next`，使隔離 app image build context 由約 700MB 降至 610KB。34/34 tests、lint、typecheck、build、health 與實際 browser login page 檢查通過；Phase 14 仍只因未觀察 1920px viewport 而 blocked。

2026-08-31 — 使用者明確允許本機 `.env` 測試帳密只輸入 `http://127.0.0.1:3000`。Phase 14 已通過並有 `evidence/phase-14.md`：已登入的 Overview 在實際 1920px 顯示 Sidebar 與資料表、Audit Log 在 1440px 顯示 Sidebar 與資料表、768px 會切換為可開啟的主要導覽；三種寬度的 document width 均等於 viewport，無水平溢位。keyboard skip path、focus、語意、文字狀態與 loading／empty／error regression 亦通過 34/34 tests、lint、typecheck、build 與 harness checks。所有 AC-001 至 AC-016 均有 passing evidence；下一項為需人員 OT 核准的條件式 Phase 08。
