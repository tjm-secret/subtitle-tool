# E-002 開發工作流一致性

## 背景與問題
- 專案曾混用 `pnpm` 風格安裝產物與 npm 指令，容易讓 lockfile、node_modules 與 dev script 狀態不一致。
- 本需求已收斂為 npm-only；後續若再引入其他 JavaScript 套件管理工具，需先同步更新正式文件與腳本。

## 目標與非目標

### 目標
- 讓 repo 對 JavaScript 相關安裝、開發、建置與啟動流程只保留一套正式指令：`npm`。
- 讓文件、agent 指引與自動化設定對同一套 npm 流程保持一致。

### 非目標
- 不重寫 Python backend 的依賴管理方式。
- 不藉此調整產品功能、UI 流程或 API contract。

## 當前決策
- root JavaScript 套件管理統一使用 `npm`。
- `frontend/` 保留為唯一 npm workspace；`api/` 不再被視為 JS workspace。
- 若現有前端依賴格式不相容於 `npm`，需在本次一併修正。

## Phase 1
- 盤點 repo 內所有 `pnpm` 指令與相關設定。
- 收斂 `npm` 對應腳本與文件寫法。

## Phase 2
- 更新 PRD / TDD 與執行 plan。
- 實作 root scripts、agent config 與文件調整。

## Phase 3
- 驗證 npm 安裝與常用指令至少能通過基本可行性檢查。

## Requirement List

### E-002-001 JavaScript 套件管理統一使用 npm
- 狀態：已完成
- 類型：已定案
- repo 中對前端與 root Node 依賴的正式操作指令，需統一以 `npm` 為準。
- root scripts、README、agent 指引與 `.kickdoc/agent-config.json` 必須同步改為 `npm`。
- npm workspace 只應涵蓋實際存在 `package.json` 的前端工作區，避免把 Python 目錄誤列為 workspace。
- 若現有前端 `package.json` 內有 npm 不支援的依賴格式，需一併修正後才算完成。

### E-002-002 README 維持為一致且可執行的專案入口
- 狀態：進行中
- 類型：已定案
- `README.md` 必須反映目前正式產品範圍，清楚描述「音檔轉錄 -> TXT / SRT -> 會議記錄」主流程，而不是只描述舊版字幕工具定位。
- `README.md` 必須以實際存在的 repo 結構、正式文件入口與可執行指令為準，避免保留會漂移的過時範例或錯誤檔名。
- `README.md` 必須區分快速開始、開發模式、production backend 設定與文件入口，讓新進維護者可快速找到正確流程。
- 若 README 提及腳本、目錄、agent 指引或產品能力，內容需與 `package.json`、`AGENTS.md`、`docs/prd.md`、`docs/tdd.md` 保持一致。

## 未決問題
- 無。

## 進入 PRD 條件
- 需求已定案。
- 指令、設定與文件的同步範圍清楚。
- 無需額外產品策略決策即可驗收。
