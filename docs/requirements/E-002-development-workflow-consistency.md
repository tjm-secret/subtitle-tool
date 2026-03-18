# E-002 開發工作流一致性

## 背景與問題
- 專案目前以 `pnpm` 撰寫 root scripts、README、agent config 與開發指引，但實際 repo 結構包含非 Node 的 `api/` 目錄，與 `npm` workspace 的期待結構不完全一致。
- 若要把 JavaScript 套件管理統一改成 `npm`，不能只替換指令字串，還需要一起校正 workspace 邊界、文件與 agent config，避免安裝或啟動流程失效。

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
- 狀態：待驗收
- 類型：已定案
- repo 中對前端與 root Node 依賴的正式操作指令，需統一以 `npm` 為準。
- root scripts、README、agent 指引與 `.kickdoc/agent-config.json` 必須同步改為 `npm`。
- npm workspace 只應涵蓋實際存在 `package.json` 的前端工作區，避免把 Python 目錄誤列為 workspace。
- 若現有前端 `package.json` 內有 npm 不支援的依賴格式，需一併修正後才算完成。

## 未決問題
- 是否要在後續補上 `package-lock.json` 並把安裝結果提交進版本控制，需視實際安裝流程是否在本 repo 被要求固定化。

## 進入 PRD 條件
- 需求已定案。
- 指令、設定與文件的同步範圍清楚。
- 無需額外產品策略決策即可驗收。
