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
