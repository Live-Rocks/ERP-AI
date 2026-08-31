# Phase 14 Plan — Responsive、Accessibility 與 UI polish

## Goal and acceptance

- Goal: 完成既有深色工業 app shell 的指定 viewport、鍵盤、語意、focus、loading、empty 與 error 可用性驗收；不改動任何 domain 或 server contract。
- Covers:
  - AC-016
- In scope:
  - 修正登入頁的部署帳密說明：不能將未設定 PostgreSQL 的開發 fallback 帳密宣稱為 Compose／既有 PostgreSQL volume 的帳密；不顯示、硬編碼或提交任何本機密碼。
  - 以 `.dockerignore` 排除本機建置產物、dependency directory 與未追蹤環境檔，讓既有 app image 可在低資源 Mac 重建，且不將 `.env` 傳入 Docker build context。
  - 補足 app shell 的 keyboard skip path 與 landmark target，保留 Sidebar／mobile Sheet、表單 label、button name、table caption、狀態文字與 `role=alert`。
  - 統一並靜態檢查 responsive breakpoints、可見 `focus-visible` ring、table overflow、loading／empty／error 呈現。
  - 讓 README、operations、architecture 與 roadmap 的目前部署、初始帳號與 Phase 05 狀態敘述與已驗證的隔離 Compose runtime 一致；不改寫 append-only ADR 或歷史 evidence。
  - 在 1920px、1440px 和 tablet 寬度對現有 live Compose UI 進行 browser layout／keyboard scenario，必要時只修正前端 presentation CSS/markup。
- Out of scope: API、server、database schema、RBAC、product workflow、資料來源、Ollama、PLC／OPC UA、動畫或設計系統替換。
- Done when: desktop、laptop、tablet app shell 不遮蔽或裁切主要內容；鍵盤可跳過導覽並到主內容、開啟 mobile navigation、看到 focus；語意與非色彩狀態提示仍在；loading、empty、error 都清楚且不捏造資料。

## Preconditions

- Dependencies/evidence read: `evidence/phase-13.md`, `PROJECT.md`, `ROADMAP.md`, `STATE.md`, `docs/ARCHITECTURE.md`, `docs/VALIDATION.md`.
- Existing conditions: Phase 09–13 have passing evidence; the isolated Compose app is available at `127.0.0.1:3000`; no backend change is authorized.

## Implementation steps

1. Inspect current app shell, page landmarks, focus styles and responsive classes; add only missing semantic/keyboard affordances such as a visible-on-focus skip link to the main landmark.
2. Confirm shared components preserve named controls, `aria-current`, table captions, status text and alert roles; add focused static regression tests for these stable conditions.
3. Use the live Compose browser at 1920px, 1440px and tablet width to verify the app shell, overview, a form/table page, AI/Audit/Settings states, mobile navigation and keyboard focus progression. Before entering the local `.env` test credentials in the browser, obtain the required action-time confirmation; do not inspect browser session stores or expose passwords.
4. If a viewport or keyboard failure is observed, apply the smallest presentation-only fix and rerun every affected viewport and automated check.

## Test and verification plan

| Behaviour or risk | Test / check | Passing condition |
| --- | --- | --- |
| Responsive layout | browser checks at 1920px, 1440px, tablet width | shell, headings, controls and tables remain usable; mobile menu replaces desktop Sidebar at tablet width |
| Keyboard/focus | browser Tab / Enter scenario | visible focus reaches skip link, mobile navigation and a primary action; skip link targets `main` |
| Semantic/non-colour state | static test | landmarks, caption, labels, `role=alert`, `aria-current`, textual `StatusBadge` and focus classes remain present |
| Data and credential states | browser/static checks | overview error and unavailable/empty components remain explicit rather than fabricated; login copy does not promise stale development credentials for Compose runtime |
| Baseline quality | `npm run lint`, `npm test`, `npm run typecheck`, `npm run build`, `git diff --check` | all exit 0 |
| Control state | `./check-harness.sh && ./check-run-state.sh` | exits 0 after evidence/control update |

## Recovery notes

- This phase must not change API responses, AI prompts, auth/session behavior, container architecture or test data.
- If browser viewport control is unavailable, record the limitation and use reproducible static/CSS checks; do not claim an unperformed viewport observation as passed.
