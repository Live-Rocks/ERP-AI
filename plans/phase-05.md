# Phase 05 Plan — 廠內部署與全流程驗收

## Goal and acceptance

- Goal: 提供單一廠內伺服器可執行的 Next.js、PostgreSQL 與 Ollama Compose stack，並驗證完整本機使用流程。
- Covers:
  - AC-005
  - AC-006
  - AC-007
  - AC-008
- In scope: production Dockerfile、Compose services/healthchecks、PostgreSQL migration mount、環境範本、部署說明及可重現 smoke command；production runtime 對 PostgreSQL 的實際持久化介面，以及僅向 Compose 內 Ollama 發送的本機 AI client。實境驗收若發現 Compose 網路無法把 loopback port 路由至 app，修正為 app 專用 ingress network 加上保留給 app／PostgreSQL／Ollama 的 internal factory network，並以 `HOSTNAME=0.0.0.0` 讓 Next.js 接受 ingress interface 的流量；PostgreSQL 與 Ollama 一律不加入 ingress network，也不建立 host port。若模擬累計計數超過 PostgreSQL `INTEGER`，以新的可升級 migration 將 line snapshot counters 升級為 `BIGINT`，並加入 schema regression test；不得重建或刪除既有 PostgreSQL volume。
- Out of scope: 真實 PLC、雲端、外網模型、設備控制。
- Done when: Compose 啟動三服務，app health endpoint 與登入、五線監控、工單、AI advice 的本機流程完成。

## Preconditions

- Dependencies/evidence read: evidence/phase-01.md 至 evidence/phase-04.md 與所有控制文件。
- Assumptions: Ollama model 由廠內管理員在映像或私有 mirror 預先備妥；runtime 不會下載或呼叫雲端資源。

## Implementation steps

1. 新增 standalone Next.js Dockerfile 與 Compose services，將 PostgreSQL 與 Ollama 僅暴露於 internal factory network；app 另以 loopback-only ingress network 接受瀏覽器流量，讓 host port 不會使資料庫或模型服務暴露。
2. 將 production runtime 的使用者、稽核、告警、工單與歷程接至 PostgreSQL，並讓告警建單與工單狀態轉換和稽核事件同交易提交；保留明確的 in-memory test adapter。
3. 讓 AI 建議先檢索授權的本機資料、再只呼叫設定的廠內 Ollama endpoint，並使來源引用由 server 端固定附加。
4. 新增 app health endpoint、環境範本及 migration bootstrap 文件。
5. 執行 static build、Compose config validation；若 Docker CLI 可用，執行 full smoke flow。
6. 對既有 volume 套用單一新增 migration，重建 app image，並重跑 health、登入、五線與完整操作驗收。

## Test and verification plan

| Behaviour or risk | Test / check | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| App correctness | type/test/build | `npm run lint && npm test && npm run build` | exits 0 |
| Local runtime boundaries | adapter/API tests | PostgreSQL adapter contract tests and mocked Ollama client test | production path persists operational events; AI request targets only configured local endpoint and preserves server-side sources |
| Compose correctness | compose parser | `docker compose config` | exits 0 |
| Full local stack | container smoke | `docker compose up -d` plus health/login/API checks | all three services healthy and flows complete |
| Control state | harness | `./check-harness.sh && ./check-run-state.sh` | exits 0 |

## Recovery notes

- `docker compose down -v` removes only named local development volumes; never run it against production data without human approval.
