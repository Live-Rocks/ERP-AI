# Implemented Architecture

This document describes the system that exists now. Keep proposed work in `ROADMAP.md`, not here.

## System boundary

瀏覽器、Next.js server/API、PostgreSQL 與 Ollama 均位於廠內網路邊界。正式 runtime 在設定 `DATABASE_URL` 時使用 PostgreSQL；未設定時僅使用可注入的 in-memory adapter 供開發與自動測試。真實 PLC、OPC UA、雲端服務與設備控制不屬於首版系統邊界。

## Components and ownership

| Component | Responsibility | Owns data/state | Interfaces |
| --- | --- | --- | --- |
| Next.js App Router | 繁中登入、儀表板與本機 API | HttpOnly session cookie 生命週期 | auth、overview、work-order、production-task、quality-record、traceability、AI、audit 與 health API |
| Auth service/repository | 驗證帳密、簽發 HMAC session、server-side RBAC | 使用者與登入／登出稽核 | `AuthRepository`；PostgreSQL runtime 首次啟動以本機環境變數建立初始帳號 |
| PostgreSQL adapter | 持久化 users、audit、五線快照、alerts、work orders、人工作業與品質追溯資料 | `0001_auth.sql` 至 `0004_quality_traceability.sql` 的資料表 | `DATABASE_URL`；`/api/health` 會檢查資料庫連線 |
| SimulatedLineDataProvider | 每五秒產生五線可重現遙測 | current line snapshots | `LineDataProvider`、`/api/factory/overview` |
| Factory data store | 告警去重、工單指派／結案與狀態歷程 | alerts、work orders、history | in-memory test adapter 或 PostgreSQL adapter |
| Production task store | 管理員建立／指派人工現場作業，以及獲指派技術員的狀態與產出回報 | production tasks、immutable task history | in-memory test adapter 或 PostgreSQL adapter；`/api/production-tasks` |
| Quality record store | 檢驗結果、不合格、技術員矯正處置與批次／序號追溯 | quality records、immutable quality history | in-memory test adapter 或 PostgreSQL adapter；`/api/quality-records`、`/api/traceability` |
| Local AI client | 將 server 檢索到的 SOP、alert、工單內容交由 Ollama 生成繁中建議 | AI 回答引用由 server 固定產生 | `OLLAMA_URL`、`OLLAMA_MODEL`、`/api/ai/advice` |
| Activity log | 重要操作的可檢視稽核 | `audit_events` | `/api/admin/audit`（僅管理員） |

## Critical flows

1. 使用者提交帳密至本機登入 API；auth service 驗證後寫入 audit，並以 HttpOnly、SameSite=Lax cookie 回傳八小時 HMAC session。
2. 已登入使用者讀取 overview；simulator 建立五線快照。正式 runtime 將快照寫入 PostgreSQL；首次異常以資料庫 partial unique index 去重，並在同一交易中建立待指派工單與初始歷程。
3. 管理員指派工單；被指派技術員記錄處置與結案。每次可接受的狀態轉換都寫入 history 與 audit。
4. 管理員建立並指派固定五線的人工現場作業；只有獲指派技術員可依 `planned → in_progress → paused/in_progress → completed` 回報本次良／不良品與停機原因。每次回報與 audit 會同一交易寫入。
5. 管理員把檢驗結果連結到既有人工現場作業與該作業的固定產線；不合格必須有缺陷描述。只有獲指派該作業的技術員可讓紀錄從 `open → corrected`，管理員才可 `corrected → closed`；管理員可按批次／序號取得關聯作業、品質紀錄與不可變歷程。
6. 已登入使用者提問時，server 組合內建 SOP、開放 alert 與相關 work order，交給廠內 Ollama 生成建議；server 再附加可追溯來源與「僅供人員參考」聲明。
7. 管理員可讀取所有重要事件的 audit；技術員對管理員 API 會取得 403。

## Data, trust, and failure boundaries

- 密碼僅以 scrypt hash 儲存，API 絕不回傳 password hash；正式環境的初始帳密只由未追蹤的 `.env` 提供。
- `DATABASE_URL` 啟用 PostgreSQL adapter；沒有資料庫設定的模式不可視為部署完成。
- `OLLAMA_URL` 僅接受內部 Docker service、localhost、`.local` 或 RFC1918／loopback HTTP endpoint；公網 URL 會在發送前拒絕。未設定模型或無法連線時，AI API 回傳 503，而非退回雲端或固定答案。
- 來源引用由 application server 決定，不信任模型自行宣稱來源。
- 模擬 provider 是唯一 OT 資料來源；程式沒有 OPC UA client、設備命令或任何 PLC 寫入介面。
- 告警去重鍵為同一 `lineId` 與 `code` 的未結案 alert；工單只能由 `pending_assignment` → `in_progress` → `resolved`。
- 人工現場作業的回報數量必須是非負整數；只有被指派技術員可回報，暫停必須提供停機原因，已完成作業不可再變更。
- 品質紀錄以 `(production_task_id, batch_or_serial)` 防止同一作業重複檢驗；通過檢驗會直接結案，不合格必須從 `open → corrected → closed`，且只有獲指派該作業的技術員可提供非空白矯正處置。沒有品質刪除 API；資料保留年限待廠內品質責任人決定。

## Operational contracts

- `0001_auth.sql` 必須先於 `0002_operational_data.sql`、`0003_production_execution.sql` 與 `0004_quality_traceability.sql` 執行；Compose 只在 PostgreSQL volume 初次建立時執行 migrations。
- Compose 只將 app 綁定 loopback；PostgreSQL 與 Ollama 無 host port。模型、image 與依賴必須先由核准的廠內來源備妥，runtime 不執行 model pull。
- `SESSION_SECRET`、`POSTGRES_PASSWORD`、初始帳密與 `OLLAMA_MODEL` 是部署前必填設定；不得提交至版本庫。
- `erp_session` 是登入與登出 API 的共同 cookie 契約；所有管理員權限皆在 server 側驗證，不能以 UI 隱藏取代。
