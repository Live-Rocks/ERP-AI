# Phase 04 Plan — 本機 AI 建議與完整稽核

## Goal and acceptance

- Goal: 以本機 SOP、告警與工單資料提供繁中排障建議與來源引用，並讓管理員檢視重要 audit event。
- Covers:
  - AC-005
  - AC-006
  - AC-007
- In scope: 內建 SOP 知識庫、唯讀檢索／建議 service、AI chat API/UI、登入／告警／工單／AI 問答 audit event、管理員 audit view。
- Out of scope: 設備命令、雲端模型、外部資料、預測與自動處置。
- Done when: AI 回答附 SOP、alert 或 work order 來源；無設備控制或外網 endpoint；管理員可查看要求的 audit event。

## Preconditions

- Dependencies/evidence read: evidence/phase-01.md、evidence/phase-02.md、evidence/phase-03.md 及目前控制文件。
- Assumptions: 未部署 Ollama 時使用可重現的本機 retrieval 回覆，Compose phase 再接上本機 Ollama；不得將資料送往外網。

## Implementation steps

1. 建立繁中 SOP documents 與本機 retrieval service，輸出回答及來源引用。
2. 新增登入保護的 AI chat API/UI，不提供工具呼叫或任何設備控制 route。
3. 統一記錄登入、告警、工單和 AI 問答 audit events，新增管理員檢視 API/UI。
4. 新增固定案例、來源引用、無控制介面與 audit 測試，更新 validation/architecture。

## Test and verification plan

| Behaviour or risk | Test / check | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| AI 建議與來源 | fixed retrieval tests | `npm test` | 回覆包含繁中建議及 SOP、alert、work order 來源 |
| 本機唯讀邊界 | static/API tests | `npm test` | 無任何 device-control route；AI route 不呼叫 HTTP client |
| Audit 完整性 | integration tests | `npm test` | 管理員看到登入、alert、work-order、AI chat event；技術員遭拒 |
| Build/control checks | commands | `npm run lint`、`npm run typecheck`、`npm run build`、harness scripts | exits 0 |

## Recovery notes

- 知識文件與 audit 為本機示範資料；移除 phase 新增模組不會影響設備或外部服務。
