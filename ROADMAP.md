# Roadmap

The roadmap is an ordered queue, not a manual checklist. A phase becomes eligible when all of its dependencies and entry conditions are satisfied.

| Phase | Goal | Depends on | Covers | Entry conditions | Done when | Verification | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 本機基礎與角色存取 | none | AC-001 | 產品契約已核准；不連接真實設備或外部服務。 | 管理員與技術員可在本機登入，且技術員無法執行管理員專屬操作。 | 型別與 lint；資料庫遷移；角色授權單元與 API 整合測試；管理員與技術員登入情境。 | completed |
| 02 | 五線模擬監控與告警 | 01 | AC-002, AC-003 | Phase 01 有通過證據；角色與本機資料儲存可用。 | 五條固定產線每五秒呈現模擬遙測與狀態；新異常建立告警與一張待指派工單，重複未結案異常不重複建單。 | 模擬 provider 單元測試；遙測與告警 API 整合測試；五線儀表板與告警去重使用者情境。 | completed |
| 03 | 維修工單處置流程 | 02 | AC-004 | Phase 02 有通過證據；模擬告警及待指派工單可用。 | 管理員可指派工單，技術員可記錄處置並結案，且每次狀態變更可追溯。 | 工單狀態轉換與授權單元測試；工單 API 整合測試；管理員指派、技術員結案的端對端情境。 | completed |
| 04 | 本機 AI 建議與完整稽核 | 03 | AC-005, AC-006, AC-007 | Phase 03 有通過證據；SOP、告警與已結案或未結案工單資料可供檢索。 | 本機 AI 以繁體中文回答並引用 SOP、告警與工單來源；沒有設備寫入或外部 AI／資料呼叫；管理員可檢視登入、告警、工單與 AI 問答稽核事件。 | 固定 SOP、告警、工單的 AI 評估案例；來源引用與拒絕控制行為測試；外部網路與設備控制介面不存在的靜態或整合檢查；稽核事件 API 與管理員檢視情境。 | completed |
| 05 | 廠內部署與全流程驗收 | 04 | AC-008 | Phase 01 至 04 均有通過證據；本機映像、設定與模型已預先備妥。 | Docker Compose 可在單一廠內伺服器啟動 Next.js、PostgreSQL 與 Ollama，並完成登入、五線監控、告警到工單與 AI 問答的本機端對端流程。 | Docker Compose build 與 up smoke test；資料庫健康檢查；管理員與技術員端對端驗收；確認 AI 請求只流向 Compose 內的 Ollama。 | blocked |

Use a two-digit phase ID such as `01`. `Depends on` is `none` or comma-separated phase IDs. `Covers` is `none` or comma-separated stable acceptance-criteria IDs such as `AC-NNN`.

`Status` tracks planning progress (`planned`, `in_progress`, `completed`, `blocked`, or `superseded`); it is never proof of completion. A `completed` phase requires matching passing evidence in `evidence/phase-XX.md`.

## Selection policy

1. Select the earliest uncompleted phase whose dependencies have passing evidence.
2. If no phase is eligible and the product criteria are not met, diagnose the blocked dependency and repair it when safe.
3. If a missing decision is required, record it in `STATE.md` and ask the user. Do not invent a product requirement.
4. A phase may be split only when its plan shows it cannot be validated as one coherent increment. Update this roadmap before implementation.
