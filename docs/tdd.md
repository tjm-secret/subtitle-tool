# 音檔取得逐字稿 MVP TDD

## 0. 文件資訊
- 對應 PRD：`docs/prd.md`
- 對應 Epic：`docs/requirements/E-001-core-product-experience.md`
- 對應 Epic：`docs/requirements/E-002-development-workflow-consistency.md`
- 對應需求：`E-001-001 核心主流程可用`、`E-001-003 第一版範圍邊界清楚`、`E-001-004 音檔轉錄後可生成會議記錄`、`E-002-001 JavaScript 套件管理統一使用 npm`、`E-002-002 README 維持為一致且可執行的專案入口`
- 文件目的：把目前已可用的音檔轉錄主流程、dev mock，以及改由 backend 生成的會議記錄能力整理成正式技術設計。

## 1. 設計目標
- 保持「音檔上傳 -> 背景轉錄 -> 查詢狀態 -> 取得 TXT / SRT」為第一版主流程。
- 在既有逐字稿結果之上提供「會議記錄整理」延伸流程，不新增獨立音檔入口。
- 讓前端經由 Next.js API route 在 production 繼續代理 backend；在 development 則維持 mock transcribe/task/result 資料，避免本機 Whisper 依賴卡住 UI 驗證。
- 讓正式的會議記錄整理改由 backend 呼叫 OpenAI-compatible provider 生成，前端只負責觸發、顯示、編修與匯出。
- 讓整理稿可匯出為 `Markdown` 與 `DOCX`，檔名統一採 `<原檔名去副檔名>_meeting-notes_<YYYY-MM-DD-HHmm>.<ext>`。
- 讓 `pending_items` 成為正式 schema 欄位，用於承接未決議事項，並與 `action_items` 明確分流。

## 2. 系統/功能架構

```text
Next.js Page
├─ Upload / status / result UI
├─ meeting notes trigger / render UI
├─ /api/transcribe proxy routes
├─ meeting notes export helpers
└─ dev mock transcribe store
   ├─ mock task lifecycle
   ├─ mock TXT / SRT result
   └─ mock convert-traditional response

FastAPI
├─ /transcribe/* task routes
├─ /transcribe/meeting-notes
└─ meeting notes service
   ├─ provider config (OpenAI-compatible)
   ├─ prompt / schema shaping
   └─ response normalization
```

## 3. 主要模組責任
- `frontend/src/app/page.tsx`
  - 提供音檔上傳、語言選擇、輪詢狀態、顯示 TXT / SRT、複製與下載結果。
  - 在轉錄完成後提供會議記錄整理入口、生成狀態、五區塊結果與 Markdown / DOCX 匯出。
- `frontend/src/app/api/transcribe/*`
  - 在 production 維持 backend proxy；在 development 針對 transcribe/task/result/cancel/tasks/convert-traditional 直接回傳 mock 資料。
  - 新增會議記錄 proxy route，development 預設仍可轉發到 backend，失敗時明確回錯。
- `frontend/src/lib/meeting-notes.js`
  - 提供整理稿匯出、DOCX blob 建立與檔名 helper。
- `frontend/src/lib/dev-transcribe-mock.js`
  - 管理開發模式的 mock task、狀態輪詢、結果內容與簡繁轉換 fallback。
- `api/src/routers/transcribe.py`
  - 保留既有轉錄 task API，新增 `POST /transcribe/meeting-notes`。
- `api/src/services/meeting_notes.py`
  - 封裝 provider endpoint、API key、model、request payload、schema 解析與錯誤對應。
- `api/src/models/meeting_notes.py`
  - 定義 meeting notes request / response schema。
- `api/tests/test_meeting_notes.py`
  - 驗證 backend 會議記錄 endpoint、provider 呼叫與錯誤處理。
- `api/requirements.txt`
  - 補上 backend 呼叫 OpenAI-compatible API 所需的 HTTP client。
- `README.md`
  - 作為 repo 對外入口，描述正式產品能力、開發模式、production backend 設定與 spec 文件入口。
  - 避免直接內嵌容易漂移的大段設定範例；若需列指令，以實際 `package.json` scripts 與現有檔案結構為準。

## 4. 資料流與狀態流
- 使用者在前端選擇音檔並送出 `POST /api/transcribe`。
- development 下，Next.js route 直接建立 mock task；production 下仍轉發到 backend `/transcribe/`。
- 前端定期查詢 `/api/transcribe/{taskId}/status`，完成後再讀 `/result` 取得 `txt` / `srt`。
- 使用者點擊 `產生會議記錄` 時，前端把 `txt`、原始音檔名與必要 metadata 送到 `/api/transcribe/meeting-notes`。
- Next.js route 轉發到 backend `/transcribe/meeting-notes`。
- backend `meeting_notes` service 以 OpenAI-compatible chat endpoint 呼叫模型，要求輸出固定五欄位 JSON。
- backend 將模型回應 normalize 成：

```json
{
  "summary": "string",
  "discussion_points": ["string"],
  "decisions": ["string"],
  "pending_items": ["string"],
  "action_items": ["string"]
}
```

- 前端收到結果後渲染五區塊，允許使用者手動編修，再以 helper 匯出 `Markdown` 與 `DOCX`。

## 5. 關鍵技術決策
- 決策 1：轉錄主流程仍保留 task-based 介面。
  - 原因：前端現有狀態管理、輪詢與結果區都圍繞 task contract 建立，會議記錄不應干擾這條成熟流程。
- 決策 2：development 的 transcribe/task/result 繼續由 Next.js route mock。
  - 原因：目前 Python Whisper 在本機開發時仍可能受 `faster_whisper` 依賴影響，前端 demo 需要穩定資料來源。
- 決策 3：會議記錄整理正式版改由 backend 生成。
  - 原因：需求已明確要求支援 OpenAI-compatible provider，正式結果不應依賴前端規則式整理。
- 決策 4：provider 使用 OpenAI-compatible HTTP contract，而不是綁定單一 SDK。
  - 原因：可同時對接 OpenAI 與 vLLM 類型部署，並減少 SDK 特定限制。
- 決策 5：整理稿輸出採固定結構化 schema，而不是只回傳自由文字。
  - 原因：PRD 已固定欄位，schema 化結果更利於前端穩定渲染、測試與匯出。
- 決策 6：`pending_items` 與 `action_items` 分成兩個獨立欄位。
  - 原因：未拍板議題不等於已指派待辦，分欄後前端顯示、匯出與後續自動化才不會混淆語意。

## 6. 錯誤處理與降級策略
- 若建立轉錄 task 失敗，前端不進入輪詢並顯示明確錯誤訊息。
- 若 backend 會議記錄 provider 未設定 endpoint / model / API key，`/transcribe/meeting-notes` 回傳 503 與可辨識訊息。
- 若 provider timeout、回傳非 JSON、或缺少必要欄位，backend 將其轉為 502，前端保留原始 TXT / SRT 並提示可重試。
- 若逐字稿內容過短或空白，前端不送出請求，直接提示使用者。
- 若原始音檔名含空白、括號或特殊字元，匯出檔名需先做安全化。
- 若 DOCX blob 建立失敗，不影響 Markdown 匯出與畫面編修。
- 若 README 中引用的檔名、指令或文件入口與 repo 現況不一致，應優先修正 README，而不是把錯誤內容視為文件權威。

## 7. 測試策略
- 前端單元測試
  - 驗證整理稿匯出格式與檔名 helper。
- 後端單元 / API 測試
  - 驗證 `/transcribe/meeting-notes` 會把逐字稿送到 provider。
  - 驗證 provider 回應會被 normalize 成固定五區塊 schema。
  - 驗證 `pending_items` 缺值時會被安全 normalize 成空陣列。
  - 驗證 provider 設定缺失、timeout 與壞格式回應會轉成明確 HTTP 錯誤。
- 人工驗收
  - 上傳音檔，確認 UI 可完成 mock transcribe 流程。
  - 點擊 `產生會議記錄`，確認 backend 返回五區塊結果。
  - 確認 `下載 Markdown` / `下載 DOCX` 檔名帶原始音檔名與時間戳。
  - 重新閱讀 README，確認產品定位、主要指令、repo 結構與文件入口與實際 repo 一致。

## 8. 風險與限制
- development 下若 backend 未啟動，會議記錄按鈕會失敗；這是預期行為，因正式生成已移到 backend。
- OpenAI-compatible provider 雖共用大致 contract，但不同部署對 `response_format` 或 JSON 輸出穩定性可能有差異，service 需保守實作解析。
- task result 目前仍是一讀即刪；若使用者刷新頁面，需重新取得逐字稿後才能再生整理稿。
- DOCX 匯出仍在前端完成，長文本文件在低階裝置上可能有額外 blob 建立成本。

## 9. 會議記錄生成設計
- backend endpoint
  - `POST /transcribe/meeting-notes`
  - request:

```json
{
  "transcript": "string",
  "source_name": "optional string"
}
```

  - response:

```json
{
  "summary": "string",
  "discussion_points": ["string"],
  "decisions": ["string"],
  "pending_items": ["string"],
  "action_items": ["string"]
}
```

- provider config
  - `MEETING_NOTES_API_BASE`
  - `MEETING_NOTES_API_KEY`
  - `MEETING_NOTES_MODEL`
  - 選配：`MEETING_NOTES_TIMEOUT_SECONDS`
- service 行為
  - 建立 system / user prompt，要求只回固定 schema JSON。
  - 呼叫 OpenAI-compatible `/chat/completions`。
  - 優先解析 JSON；若模型回傳包在 markdown code fence 中，先清理再 parse。
  - 將空值 normalize 為空字串或空陣列，不把缺欄位直接透傳給前端。
  - prompt 需明確區分 `pending_items`（未決議事項）與 `action_items`（待辦事項）。

## 10. npm / Python 工作流調整
- root JavaScript 工作流維持 `npm`。
- `frontend/package-lock.json` 作為前端實際 lockfile 保留。
- `api/requirements.txt` 補上 backend HTTP client 套件。
- `api/env.template` 補上會議記錄 provider 相關環境變數。
- README 採「產品概覽 -> 快速開始 -> 開發模式 -> production backend -> 文件入口」結構重寫，讓維護者不必從零拼湊操作路徑。

## 11. 未決問題
- provider 是否需要支援 streaming；第一版先不做。
- 若之後需要「重新生成某一區塊」能力，應擴成局部更新 API 還是完整重算。
- task result 是否要持久化，避免刷新頁面後無法再次生成會議記錄。
