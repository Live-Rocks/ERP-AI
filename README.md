# AI ERP 智慧工廠

一套以繁體中文為預設、可在單一廠區內自架的智慧工廠管理原型。它協助工廠管理員與技術員監控五條產線、處理異常與維修工單，並取得附來源引用的本機排障建議。

## 已驗證功能

- 管理員與技術員登入，以及 server-side 角色存取控制。
- 固定五條模擬產線的狀態、產量、不良品與每五秒更新的儀表板。
- 異常告警、同一未結案異常的去重，以及待指派維修工單。
- 管理員指派、技術員處置與結案，並保留工單狀態歷程。
- 管理員建立並指派固定五線的人工現場作業；技術員可回報開始、暫停、完成、良品／不良品與停機原因。
- 管理員記錄連結作業／產線／批次或序號的檢驗與不合格；獲指派技術員可填寫矯正處置，管理員可結案並追溯相關歷程。
- 以內建繁中 SOP、告警與工單資料提供帶來源引用的本機排障建議。
- 管理員可檢視登入、告警、工單、人工現場作業、品質紀錄與 AI 問答的稽核紀錄。

詳情與可驗證的產品契約請見 [PROJECT.md](PROJECT.md)；已通過 phase 的實際結果請見 [evidence/](evidence/)。

## 開發快速開始

需求：Node.js 24 與 npm。

```bash
npm install
npm run dev
```

開啟 `http://localhost:3000` 後可使用下列**僅限開發示範**帳號：

| 角色 | 帳號 | 密碼 |
| --- | --- | --- |
| 管理員 | `admin` | `admin-demo` |
| 技術員 | `tech` | `tech-demo` |

正式部署前必須改用廠內使用者帳號，並以 `SESSION_SECRET` 等祕密設定取代示範設定。

### 驗證指令

```bash
npm run lint
npm run typecheck
npm test
npm run build
./check-harness.sh
./check-run-state.sh
```

## 廠內部署狀態

專案已提供 Next.js、PostgreSQL 與 Ollama 的 [Docker Compose 定義](compose.yaml)、[Dockerfile](Dockerfile) 與 [操作手冊](docs/OPERATIONS.md)。

目前為「功能原型／部署待驗證」：此工作區沒有 Docker CLI，因此尚未執行 Compose config、容器啟動與三服務端到端 smoke test；`AC-008` 尚未通過。部署時請先複製 `.env.example` 為 `.env`，設定廠內祕密，並在具 Docker Compose 的環境執行：

```bash
docker compose up --build -d
```

不要將此命令直接用於已有重要資料的生產環境；操作手冊包含手動備份、隔離還原演練與既有 volume migration 升級注意事項。完整資料與復原注意事項見 [docs/OPERATIONS.md](docs/OPERATIONS.md)。這些 Docker 操作尚未在此工作區通過實境驗證。

## 安全與範圍

- 資料與 AI 請求設計為留在廠內；不使用雲端 AI 或外部資料服務。
- 系統只提供人員參考建議，沒有 PLC／設備寫入或自動控制介面。
- 真實 OPC UA／PLC 連線、故障預測、自動派工、排程、庫存及財務不在首版範圍；品質功能也不會調整庫存、隔離／報廢帳務或排程。
- 開發與測試使用可注入的記憶體 adapter；設定 `DATABASE_URL` 的部署 runtime 會使用 PostgreSQL。AI 僅呼叫本機 Ollama endpoint，並在模型未備妥時明確回報不可用；兩者仍須完成 Compose 實境驗證後才可宣稱正式可用。

## 專案治理與驗證

本專案保留 Harness 作為開發治理層，而非產品本身：

- [AGENTS.md](AGENTS.md)：自主執行與安全規則。
- [ROADMAP.md](ROADMAP.md)：phase 相依關係與完成狀態。
- [STATE.md](STATE.md)：目前執行位置與 blocker。
- [plans/](plans/) 與 [evidence/](evidence/)：每個 phase 的計畫及可驗證結果。
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)：目前已實作的系統邊界與契約。
