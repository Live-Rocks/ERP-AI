# Decisions

This is an append-only Architecture Decision Record (ADR) log. A decision belongs here when it changes architecture, product boundaries, data governance, safety, evaluation claims, irreversible cost, or the option space for later phases.

Do not record routine implementation details. Do not rewrite accepted history: add a new entry with `Supersedes: Dxxx` when direction changes. Use [`templates/DECISION.md`](../templates/DECISION.md) to create the next record.

# D001 — 採用本機優先的五線 AI 維修與監控首版

- Date: 2026-08-30
- Status: accepted
- Supersedes: none

## Context

首版服務單一廠區的管理員與技術員，需管理五條產線，且使用者要求業務資料與 AI 推論優先留在本機。真實 PLC 介接的端點、憑證與點位表目前未提供。

## Decision

首版採用 TypeScript、Next.js／React、Next.js server/API、PostgreSQL 與 Docker Compose，並以 Ollama 提供本機 AI 推論。系統提供每五秒更新的五線模擬資料與可替換的資料 provider 邊界；AI 只檢索廠內 SOP、告警及工單資料，僅提出帶來源引用的建議。AI 及產品不提供設備控制或外部資料服務。

## Consequences

可在未取得 PLC 存取權時交付完整可演示的監控與維修流程，並保留 OPC UA 整合空間。首版不主張真實設備即時性、預測能力或自動控制；未來若要連接真實設備、外網或雲端服務，必須建立新的核准決策與驗證計畫。

# D002 — 在部署驗收延後期間核准人工現場作業 Phase 06

- Date: 2026-08-30
- Status: accepted
- Supersedes: none

## Context

Phase 05 的 Docker Compose 系統驗收因工作區沒有 Docker CLI 而無法取得 passing evidence。人員明確要求不等待該外部環境，先啟動已規劃的 Phase 06。成熟 MES 將人員操作回報視為生產與品質資料的基礎，但目前產品仍禁止自動排程、真實 PLC 與設備控制。

## Decision

保留 Phase 05 為 blocked，且 AC-008 仍未通過；它是產品 release 的未解阻礙。Phase 06 改為依賴已有 evidence 的 Phase 04，新增 AC-009，交付固定五線的人工現場作業建立、指派與技術員回報。所有狀態轉換都由 server-side RBAC 與 audit 保護，資料來源仍是使用者輸入與模擬資料。

## Consequences

可在沒有 Docker 的開發環境持續交付可驗證的現場作業垂直切片，而不把未完成的容器驗收偽稱為通過。Phase 06 完成也不解除 AC-008 的 release blocker，且不授權自動排程、機器控制或外網連線。

# D003 — 核准品質不合格與批次／序號追溯 Phase 07

- Date: 2026-08-30
- Status: accepted
- Supersedes: none

## Context

Phase 06 已有通過 evidence，使用者明確要求啟動已規劃的品質不合格與批次／序號追溯。產品需要可追溯的人工品質處置資料，但尚未核准庫存、排程、條碼設備、真實 OT 或外部服務。此工作區也仍不能執行 Docker Compose。

## Decision

新增 AC-010：管理員以既有人工現場作業、固定產線與使用者輸入的唯一批次／序號建立檢驗結果；不合格必須記錄缺陷描述。僅被指派該作業的技術員可填寫矯正處置；管理員可在已有矯正處置後結案，並依批次／序號查閱作業、檢驗與處置歷程。建立、處置與結案皆寫入稽核。首版不提供刪除 API；正式資料保留年限應在開始收集生產資料前，由廠內法規／品質責任人另行決定。

## Consequences

Phase 07 可在 Phase 06 的人工作業資料上形成可驗證的品質閉環，且不需 PLC、憑證或真實設備。它不解除 Phase 05／AC-008 的 release blocker，亦不授權任何庫存異動、隔離／報廢帳務、自動排程、設備控制、雲端資料傳輸或 OT 連線。

# D004 — 在部署驗收延後期間核准前端工業 SaaS 重構

- Date: 2026-08-31
- Status: accepted
- Supersedes: none

## Context

Phase 07 有通過 evidence，但 Phase 05 的 Docker Compose 驗收仍因缺少 Docker CLI 而 blocked。人員明確要求保留既有 Next.js／React／TypeScript 與 backend contract，將單頁 dashboard 重構為深色 Industrial SaaS／MES 多頁 UI，並使用 Tailwind CSS、shadcn/ui、Lucide React 與 Recharts。

## Decision

新增 AC-011 至 AC-016，將前端工作依 Phase 09–14 執行，依賴 Phase 07 evidence 而不等待 Phase 05。UI 只能使用既有 API；沒有 API 的 Production Orders、Telemetry、Maintenance 與可寫 Settings 必須顯示明確不可用狀態。OEE 與停機時長缺乏真實來源，因此不得合成數字；production trend 僅使用目前瀏覽器工作階段累積的既有 overview polling 樣本。所有既有 server-side RBAC、資料和 OT 安全邊界維持不變。

## Consequences

可在沒有 Docker 的開發環境交付與驗證現場使用者可見的 UI 改善，而不將 Compose 驗收誤稱為通過。UI 完成不解除 AC-008 release blocker，也不授權 backend、schema、PLC、OPC UA、外部網路或設備控制變更。
