# Phase 05 Plan — 廠內部署與全流程驗收

## Goal and acceptance

- Goal: 提供單一廠內伺服器可執行的 Next.js、PostgreSQL 與 Ollama Compose stack，並驗證完整本機使用流程。
- Covers:
  - AC-008
- In scope: production Dockerfile、Compose services/healthchecks、PostgreSQL migration mount、環境範本、部署說明及可重現 smoke command。
- Out of scope: 真實 PLC、雲端、外網模型、設備控制。
- Done when: Compose 啟動三服務，app health endpoint 與登入、五線監控、工單、AI advice 的本機流程完成。

## Preconditions

- Dependencies/evidence read: evidence/phase-01.md 至 evidence/phase-04.md 與所有控制文件。
- Assumptions: Ollama model 由廠內管理員在映像或私有 mirror 預先備妥；runtime 不會下載或呼叫雲端資源。

## Implementation steps

1. 新增 standalone Next.js Dockerfile 與 Compose services，將 PostgreSQL 與 Ollama 僅暴露於內部 network。
2. 新增 app health endpoint、環境範本及 migration bootstrap 文件。
3. 執行 static build、Compose config validation；若 Docker CLI 可用，執行 full smoke flow。

## Test and verification plan

| Behaviour or risk | Test / check | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| App correctness | type/test/build | `npm run lint && npm test && npm run build` | exits 0 |
| Compose correctness | compose parser | `docker compose config` | exits 0 |
| Full local stack | container smoke | `docker compose up -d` plus health/login/API checks | all three services healthy and flows complete |
| Control state | harness | `./check-harness.sh && ./check-run-state.sh` | exits 0 |

## Recovery notes

- `docker compose down -v` removes only named local development volumes; never run it against production data without human approval.
