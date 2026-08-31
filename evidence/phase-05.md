# Phase 05 Evidence — 廠內部署與全流程驗收

Status: passed
Phase: 05
Acceptance criteria satisfied:

- AC-005
- AC-006
- AC-007
- AC-008
Base revision: e056bf93b954403274cd87ece1fa5f713b1df457
Result revision: working tree (uncommitted)

## Environment established

macOS 13.4.1 Apple Silicon 的隔離驗證 host 已安裝 Homebrew 6.0.20、Colima 0.10.3、Docker CLI 29.7.2 與 Docker Compose 5.5.0。Colima profile `erp-ai-phase12` 運行於 macOS Virtualization.Framework，資源為 2 CPU、4GiB RAM、30GiB disk；測試 `.env` 為未追蹤檔案，使用新產生的本機帳密與 `OLLAMA_MODEL=qwen2.5:1.5b`。

## Passed setup checks

Command: `docker compose -p erp-ai-phase12 config >/private/tmp/erp-ai-phase12-compose-config.yaml && docker compose -p erp-ai-phase12 config --services`
Result: passed.
Observed: Compose parser 成功列出 `ollama`、`postgres`、`app` 三個服務；未建立 ERP app、PostgreSQL 或 Ollama Compose container。

Check: `colima status erp-ai-phase12` and `docker version --format '{{.Server.Version}}'`.
Result: passed.
Observed: Colima Docker runtime 正常，context 為 `colima-erp-ai-phase12`；Docker server version 為 29.5.2。

## Initial blocked attempt (preserved)

Check: 以新的 `erp-ai-phase12_ollama-data` volume 執行 `docker run ... ollama/ollama:latest`，再以 `docker pull ollama/ollama:latest` 重試，預備一次性下載 `qwen2.5:1.5b`。
Result: blocked; image download did not complete.
Observed: 第一輪拉取完成數個小 layer 後，大型 `db99732c5f9a` layer 長時間沒有進度；停止後 Docker `system df` 顯示 Images 為固定 480.6MB、Containers 為 0。第二輪只重試該 layer，同樣無進度後安全取消。未完成 image、未啟動 seed container、未下載模型，亦未啟動 Compose stack。

## Recovery and passing verification

網路後續恢復，`ollama/ollama:latest` image 與 `qwen2.5:1.5b` 已在獨立 `erp-ai-phase12_ollama-data` volume 預載。首次 Compose runtime 發現 app-only internal network 不會建立可用 loopback route；依 D005 修正為 app ingress bridge network 加 internal factory network，且將 Next.js listener 設為 `HOSTNAME=0.0.0.0`。PostgreSQL 與 Ollama 仍只有 internal factory endpoint、無 host port。實境 refresh 也發現模擬產線累計值超過 `INTEGER`；新增 `0005_line_snapshot_bigint.sql` 並只對隔離 PostgreSQL volume 套用一次。

## Verification

Command: `docker compose -p erp-ai-phase12 build --quiet app && docker compose -p erp-ai-phase12 up -d && docker compose -p erp-ai-phase12 ps`
Result: passed.
Observed: `app` running at `127.0.0.1:3000->3000/tcp`、`postgres` healthy、`ollama` running；三者均由同一隔離 project 啟動。

Command: `curl --fail http://127.0.0.1:3000/api/health && docker compose -p erp-ai-phase12 exec -T ollama ollama list`
Result: passed.
Observed: health 回傳 `status: ok`、`storage: postgresql`、`localOnly: true`；模型清單含 `qwen2.5:1.5b`（986 MB）。

Check: browser administrator login → five-line overview → assign one alert-created work order; browser technician login → add resolution and close it.
Result: passed.
Observed: 以 production secure session cookie 完成兩種角色登入。Overview 同時顯示五條固定模擬產線、每五秒同步資訊與一張 line-03 simulated over-temperature alert work order；管理員指派後，技術員將工單結案並保留處置內容。

Check: authenticated `POST /api/ai/advice` with question about line-03 temperature alert; `docker compose ... exec app printenv OLLAMA_URL`.
Result: passed.
Observed: AI 回覆繁中檢查建議並固定附上 `SOP-COOL-001`、line-03 alert、resolved work order 三筆來源；runtime endpoint 為 `http://ollama:11434`。未出現設備控制路徑或外部 AI endpoint。

Command: `docker compose -p erp-ai-phase12 exec -T postgres psql ...` audit query.
Result: passed.
Observed: 有 `alert.created`、`work_order.assigned`、`work_order.resolved`、`ai.advice` 等 audit events，且 `line_snapshots` 為 5 筆。

Command: `npm test && npm run lint && npm run typecheck && npm run build && ./check-harness.sh && ./check-run-state.sh && git diff --check`
Result: passed after control files were updated.
Observed: 29/29 automated tests passed，production build completed，harness structure/run state valid，working-tree whitespace check clean。
