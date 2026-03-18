# npm Workflow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 repo 的 JavaScript 套件管理與文件正式收斂為 npm 工作流。

**Architecture:** 先更新 requirements、PRD、TDD，定義 npm 為唯一正式 JS 套件管理工具。接著修改 root scripts、workspace 範圍、agent config 與相關文件，並移除會阻塞 npm 安裝的設定。

**Tech Stack:** npm workspaces, Next.js 15, FastAPI, Markdown docs

---

### Task 1: Formalize the requirement

**Files:**
- Create: `docs/requirements/E-002-development-workflow-consistency.md`
- Modify: `docs/requirements/README.md`
- Modify: `docs/prd.md`
- Modify: `docs/tdd.md`

- [x] Step 1: 新增 E-002 Epic，定義 npm 工作流一致性需求。
- [x] Step 2: 更新 requirements index 與 promotion snapshot。
- [x] Step 3: 在 `docs/prd.md` 補上 npm 為正式維護流程的產品/維護需求。
- [x] Step 4: 在 `docs/tdd.md` 補上 npm workspace、workspace 邊界與依賴相容性設計。

### Task 2: Update executable repo configuration

**Files:**
- Modify: `package.json`
- Modify: `.kickdoc/agent-config.json`
- Modify: `frontend/package.json`
- Delete: `pnpm-lock.yaml`

- [x] Step 1: 將 root scripts 從 `pnpm` 改寫為 `npm` workspace 指令。
- [x] Step 2: 把 `api/` 從 workspace 清單移除，只保留 `frontend/`。
- [x] Step 3: 修正 `frontend/package.json` 內 npm 不支援的依賴宣告。
- [x] Step 4: 移除已不再適用的 `pnpm-lock.yaml`。

### Task 3: Align documentation and guidance

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `frontend/README.md`

- [x] Step 1: 將 README 內所有正式指令改為 `npm`。
- [x] Step 2: 更新 agent 指引，移除「必須使用 pnpm」的描述。
- [x] Step 3: 將前端預設 README 的多套件管理工具示例收斂為 npm。

### Task 4: Verify npm viability

**Files:**
- No file changes required

- [x] Step 1: 執行基本 npm 可行性檢查，確認不再被 workspace 或 `link:` 依賴格式阻塞。
- [x] Step 2: 重新掃描 repo 中殘留的 `pnpm` 字串，確認正式文件與設定已同步。
- [x] Step 3: 彙整尚未完成的驗證項目，例如 lockfile 或完整安裝測試是否需要後續補做。
