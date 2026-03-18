# TDD

## 0. 文件資訊
- 對應 PRD：`docs/prd.md`
- 對應 Epic：`docs/requirements/E-001-core-product-experience.md`
- 對應需求：`E-001-004 音檔轉錄後可生成會議記錄`
- 文件目的：把既有轉錄結果延伸為可呼叫 OpenAI-compatible API 的會議記錄生成功能

## 1. 設計目標
- 在不改寫既有音檔上傳與轉錄 worker 主流程的前提下，新增「逐字稿 -> 會議記錄」能力。
- 透過 server-side adapter 封裝 OpenAI-compatible chat completion 呼叫，允許真正的 OpenAI API 或 vLLM 使用相同設定介面。
- 讓前端以獨立的 API route 與 UI 狀態管理會議記錄生成，不破壞現有 TXT / SRT 結果。

## 2. 系統/功能架構

```text
Frontend Page
├─ Existing transcription form and polling
├─ Meeting-notes UI state
└─ Next.js API route /api/meeting-notes
   └─ ApiClient proxy
      └─ FastAPI router /meeting-notes
         ├─ Request validation
         ├─ MeetingNotesService
         │  ├─ Prompt builder
         │  ├─ OpenAI-compatible client
         │  └─ Response parser
         └─ Error mapping
```

## 3. 主要模組責任
- `frontend/src/app/page.tsx`
  - 延伸既有結果畫面，新增會議記錄 tab、生成按鈕、loading/error/result state。
- `frontend/src/app/api/meeting-notes/route.ts`
  - 接收前端請求並轉發到 backend meeting-notes endpoint。
- `frontend/src/lib/api-client.ts`
  - 沿用既有 API proxy 能力，支援 meeting-notes route。
- `api/src/routers/meeting_notes.py`
  - 定義 request/response schema、錯誤回應與 meeting-notes endpoint。
- `api/src/services/meeting_notes_service.py`
  - 組 prompt、呼叫 LLM、解析回傳 JSON、回傳 domain object。
- `api/src/services/openai_compatible_client.py`
  - 封裝 base URL、API key、model 與 HTTP request。
- `api/tests/...`
  - 驗證 prompt/output parser、endpoint behavior 與設定缺失時的錯誤處理。

## 4. 資料流與狀態流
- 使用者完成轉錄後，前端已持有 `txt` / `srt` 結果；會議記錄生成只使用 `txt` 作為輸入。
- 前端送出 `transcript` 到 `/api/meeting-notes`。
- Next.js API route 以現有 `ApiClient.post` 代理到 backend `/meeting-notes`。
- Backend router 驗證輸入非空，呼叫 `MeetingNotesService.generate(transcript)`。
- Service 讀取環境變數：
  - `MEETING_NOTES_API_BASE_URL`
  - `MEETING_NOTES_MODEL`
  - `MEETING_NOTES_API_KEY`（選填；OpenAI 通常需要，部分 vLLM 可不需要）
  - 可選 `MEETING_NOTES_SYSTEM_PROMPT`
- Service 產生要求固定 JSON 結構的 prompt，呼叫 OpenAI-compatible `/chat/completions`。
- Backend 解析模型回傳內容為固定 schema：
  - `summary`
  - `highlights`
  - `decisions`
  - `action_items`
- 前端收到結果後在 Meeting Notes tab 呈現，並提供 copy/download。

## 5. 關鍵技術決策
- 決策 1：沿用既有轉錄結果，不重跑音檔。
  - 原因：最小化成本與改動範圍，也避免耦合語音模型與摘要模型。
- 決策 2：使用 OpenAI-compatible HTTP adapter，而非直接綁定官方 SDK。
  - 原因：要同時相容 vLLM 與 OpenAI；HTTP adapter 對 base URL 控制更直接。
- 決策 3：要求模型輸出 JSON，再由後端解析成固定 schema。
  - 原因：比純文字段落更穩定，便於前端渲染與測試。
- 決策 4：MVP 不做背景 task queue。
  - 原因：會議記錄生成通常比轉錄輕量，先同步請求即可；若後續 latency 成問題再演進。

## 6. 錯誤處理與降級策略
- 缺少必要 API 設定 -> backend 回 `503` 或 `500` 等明確錯誤，訊息指出缺哪個設定。
- 外部 API timeout / 5xx -> backend 回可辨識失敗訊息；前端保留逐字稿並允許重試。
- 模型回傳非 JSON 或缺欄位 -> service 做解析錯誤處理並回傳 `502` 類型錯誤。
- transcript 為空 -> router 直接回 validation error，不發外部請求。
- 前端生成中重複點擊 -> UI 禁用按鈕避免重送。

## 7. 測試策略
- 單元測試
  - 測 prompt builder 會要求固定四區塊 JSON。
  - 測 response parser 能處理合法 JSON 與異常回應。
  - 測設定缺失時 service 會拋出明確錯誤。
- 整合測試
  - 測 `/meeting-notes` endpoint 在成功情境下回傳完整 schema。
  - 測 backend 對外部 API 錯誤、空 transcript、格式錯誤的回應。
  - 測 frontend API route 代理行為。
- 人工驗收
  - 上傳音檔完成轉錄。
  - 點擊生成會議記錄。
  - 確認 UI 顯示四區塊、copy/download 可用、失敗時錯誤訊息可見。

## 8. 風險與限制
- 不同 OpenAI-compatible 實作對 response format 支援程度不同，需以 parser 容錯保護。
- 長逐字稿可能超過模型 token 限制；MVP 先依模型限制失敗回報，不做 chunking。
- 若輸入是語氣詞很多、結構鬆散的逐字稿，會議記錄品質受模型能力影響。

## 9. 未決問題
- 是否要在 API 層加入 token/temperature/max_tokens 等進階設定；MVP 先不暴露。
- 是否要把會議記錄結果保存在 task history；MVP 先只存在前端當次結果。
