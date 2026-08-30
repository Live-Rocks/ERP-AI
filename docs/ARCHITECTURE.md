# Implemented Architecture

This document describes the system that exists now. Keep proposed work in `ROADMAP.md`, not here.

## System boundary

本專案目前提供廠內自架的 Next.js 應用基礎與角色存取控制。瀏覽器、Next.js server/API 與未來的 PostgreSQL 均屬於廠內邊界；真實 PLC、OPC UA、雲端服務及設備控制均不屬於首版系統邊界。

## Components and ownership

| Component | Responsibility | Owns data/state | Interfaces |
| --- | --- | --- | --- |
| Next.js App Router | 繁中登入頁、角色導向首頁及本機 API | HttpOnly session cookie 生命週期 | `/api/auth/login`、`/api/auth/logout`、`/api/auth/me`、`/api/admin/users` |
| Auth service | 驗證帳密、簽發與驗證 HMAC session、限制管理員操作 | 使用者身分與角色 | repository 介面、signed cookie |
| Auth repository | 提供開發示範帳號與 audit event 儲存抽象 | 使用者與登入／登出事件 | `AuthRepository` |
| PostgreSQL migration | 定義日後廠內持久化的 auth schema | `users`、`sessions`、`audit_events` | `db/migrations/0001_auth.sql` |
| SimulatedLineDataProvider | 每五秒產生固定五線的可重現遙測快照 | 產線狀態與產量快照 | `LineDataProvider`、`/api/factory/overview` |
| Factory store | 對新異常建立告警與待指派工單，並以 line/code 去重 | 開放告警與待指派工單 | `FactoryStore` |
| Work-order route | 執行管理員指派及技術員處置／結案 | 工單狀態與不可變歷程 | `/api/work-orders/[id]` |

## Critical flows

1. 使用者提交帳密至本機登入 API。
2. Auth service 驗證密碼、記錄登入事件，並以 HttpOnly、SameSite=Lax cookie 回傳短期 session token。
3. 受保護 API 驗證 token 與角色；管理員 API 對技術員回傳 403。
4. 登出 API 清除 cookie 並記錄登出事件。
5. 已登入使用者讀取 factory overview；模擬 provider 產生五線快照，首次異常建立告警及待指派工單，同一開放異常不重複建單。
6. 管理員將待指派工單指派給技術員；只有該技術員可提交處置並結案，每次轉換寫入歷程。

## Data, trust, and failure boundaries

- 密碼只以 scrypt hash 保存於使用者資料；API 絕不回傳 password hash。
- session payload 使用 HMAC 防竄改，預設有效期八小時；部署前必須以 `SESSION_SECRET` 設定廠內祕密。
- 目前預設 repository 僅提供示範用的 in-memory 資料；PostgreSQL migration 已交付，但尚未連接任何生產資料庫。
- 模擬 provider 是唯一的 OT 資料來源，沒有 OPC UA client、設備命令或任何寫入設備的介面。
- 告警去重鍵為同一 `lineId` 與 `code` 的未結案告警；後續工單 phase 必須保留此 idempotency 邊界。
- 工單只能由 `pending_assignment` 轉為 `in_progress`，再由被指派技術員轉為 `resolved`；無效轉換回傳 conflict。
- 本 phase 沒有外部網路呼叫、設備寫入或 PLC 通訊；後續功能必須延續唯讀設備控制邊界。

## Operational contracts

- `db/migrations/0001_auth.sql` 必須先於任何依賴使用者、session 或 audit event 的持久化功能執行。
- 管理員 API 必須在未登入或非管理員請求時拒絕；不能以 UI 隱藏取代 server-side 授權。
- API session cookie 名稱 `erp_session` 是目前登入與登出路由共同契約。
- `/api/factory/overview` 必須要求登入，並同時供管理員與技術員讀取；dashboard 每 5 秒重新讀取此唯讀介面。
