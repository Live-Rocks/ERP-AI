# Phase 01 Plan — 本機基礎與角色存取

## Goal and acceptance

- Goal: 建立以 TypeScript 與 Next.js 實作的本機應用基礎、PostgreSQL schema/migration 與兩種角色的登入／授權流程。
- Covers:
  - AC-001
- In scope: Next.js App Router、資料庫存取層與 migration、管理員及技術員的種子帳號、簽章 session cookie、受保護 API、登入畫面及角色導向首頁。
- Out of scope: 產線、告警、工單、AI、設備控制、真實 PLC、Docker Compose 與任何外網服務。
- Done when: 管理員和技術員可用本機種子帳號登入；技術員存取管理員專屬 API 時取得 403；schema 可建立 users、sessions 與 audit_events 表。

## Preconditions

- Dependencies/evidence read: PROJECT.md、ROADMAP.md、STATE.md、docs/VALIDATION.md、docs/ARCHITECTURE.md、docs/DECISIONS.md。
- Assumptions: 開發與測試使用可替換的 repository；正式執行時以 `DATABASE_URL` 連到廠內 PostgreSQL。未安裝 Docker 或 PostgreSQL CLI 不妨礙建立 schema、migration、靜態與應用層驗證。

## Implementation steps

1. 建立 Next.js TypeScript 應用與測試工具鏈。
2. 定義使用者、session 與 audit event 的領域型別，並提供 PostgreSQL migration、種子資料與 repository 介面。
3. 實作以簽章 HttpOnly cookie 為基礎的登入、登出及目前使用者 API；登入和登出寫入 audit event。
4. 實作管理員專屬使用者清單 API 與首頁，驗證技術員會遭拒絕。
5. 補齊單元、API 與登入頁面驗證，更新已實作架構與 validation gate。

## Test and verification plan

| Behaviour or risk | Test / check | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| TypeScript 與程式風格 | lint 與 type check | `npm run lint`、`npm run typecheck` | exits 0 |
| 角色與 session 邏輯 | 單元測試 | `npm test` | 管理員獲准、技術員遭拒、無效憑證無法登入 |
| 使用者可登入 | Next build 與 API route 測試 | `npm run build`、`npm test` | 登入導向首頁，受保護 API 依角色回應 |
| PostgreSQL 交付物 | migration 靜態檢查 | `npm test` | migration 含 users、sessions、audit_events 與必要索引 |
| 控制文件一致性 | harness 檢查 | `./check-harness.sh`、`./check-run-state.sh` | exits 0 |

## Recovery notes

- 移除新增應用檔案可回復至 harness-only 狀態；尚未連接任何生產資料庫或設備。
- 若 schema 或 session 行為失敗，先以 repository 單元測試重現，再修正後重跑完整驗證組合。
