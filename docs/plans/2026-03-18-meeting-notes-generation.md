# Meeting Notes Generation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有逐字稿結果頁加入由 backend 生成的會議記錄整理功能，支援 `pending_items` 未決議事項欄位，並保留可辨識檔名的 Markdown / DOCX 匯出。

**Architecture:** development 下維持 Next.js mock transcribe 流程，避免 Whisper 依賴阻塞 UI；但會議記錄正式結果改由 FastAPI 新增 endpoint 呼叫 OpenAI-compatible provider 生成。前端只負責觸發、顯示、編修與下載整理稿，並將 `pending_items` 與 `action_items` 分開渲染與匯出。

**Tech Stack:** Next.js 15, React 19, FastAPI, Python requests/httpx client, Node built-in test runner, pytest, npm workspaces

---

### Task 1: Define backend meeting-notes schemas and service

**Files:**
- Create: `api/src/models/meeting_notes.py`
- Create: `api/src/services/meeting_notes.py`
- Modify: `api/requirements.txt`
- Modify: `api/env.template`
- Test: `api/tests/test_meeting_notes.py`

- [ ] Step 1: 先寫 `api/tests/test_meeting_notes.py`，定義 request/response schema、provider 正常回傳、provider 壞格式回傳、provider 未設定等行為。
- [ ] Step 1.1: 在 schema 與 service 測試中加入 `pending_items`，並鎖定缺欄位時會 normalize 成空陣列。
- [ ] Step 2: 執行 `pytest api/tests/test_meeting_notes.py -q`，確認測試先失敗。
- [ ] Step 3: 建立 meeting notes schema 與 service，封裝 provider config、prompt、JSON 解析與 normalize。
- [ ] Step 3.1: 更新 fallback 與 provider prompt，要求區分 `pending_items` 與 `action_items`。
- [ ] Step 4: 再跑 `pytest api/tests/test_meeting_notes.py -q`，確認 service 與 schema 轉綠。

### Task 2: Add FastAPI meeting-notes endpoint

**Files:**
- Modify: `api/src/routers/transcribe.py`
- Modify: `api/src/whisper_api.py`
- Test: `api/tests/test_api_endpoints.py`

- [ ] Step 1: 在 `transcribe.py` 加入 `POST /transcribe/meeting-notes`。
- [ ] Step 2: 將 endpoint 接到 meeting notes service，對 provider 錯誤轉成明確 HTTP status。
- [ ] Step 3: 補 `api/tests/test_api_endpoints.py` 的 endpoint 測試。
- [ ] Step 4: 執行 `pytest api/tests/test_api_endpoints.py -q`，確認 endpoint 契約通過。

### Task 3: Switch frontend meeting-notes generation to backend

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/api/transcribe/meeting-notes/route.ts`
- Modify: `frontend/src/lib/meeting-notes.js`
- Modify: `frontend/src/lib/meeting-notes.test.js`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

- [ ] Step 1: 在前端先寫或補 meeting notes helper 測試，鎖定檔名規則與匯出格式。
- [ ] Step 1.1: 補 `pending_items` 的匯出與 view-state 測試，確認 Markdown / DOCX / UI 都有第五區塊。
- [ ] Step 2: 新增 Next.js proxy route，把前端請求轉發到 backend `/transcribe/meeting-notes`。
- [ ] Step 3: 把 `產生會議記錄` 從本地規則式整理改為呼叫 backend；保留 Markdown / DOCX 匯出與編修 UI。
- [ ] Step 3.1: 在會議記錄頁與統計卡補上 `未決議事項` 顯示與編修。
- [ ] Step 4: 確認下載檔名維持 `<原檔名去副檔名>_meeting-notes_<YYYY-MM-DD-HHmm>.<ext>`。
- [ ] Step 5: 執行 `node --test frontend/src/lib/meeting-notes.test.js`。
- [ ] Step 6: 執行 `npm run lint --workspace frontend`。

### Task 4: End-to-end verification and doc sync

**Files:**
- Modify: `docs/requirements/E-001-core-product-experience.md`
- Modify: `docs/requirements/README.md`
- Modify: `docs/prd.md`
- Modify: `docs/tdd.md`
- Modify: `docs/plans/2026-03-18-meeting-notes-generation.md`

- [ ] Step 1: 執行 `pytest api/tests/test_meeting_notes.py api/tests/test_api_endpoints.py -q`。
- [ ] Step 2: 若 API env.template 或 route contract 有調整，回寫文件描述。
- [ ] Step 3: 人工驗證一次完整流程：上傳音檔、等待 mock 完成、點擊 `產生會議記錄`、確認 backend 回傳五區塊、確認可下載 Markdown / DOCX。
- [ ] Step 4: 將 `E-001-004` 的追蹤描述更新為實際 backend / frontend 進度。
