# 音檔取得逐字稿 MVP TDD

## 0. 文件資訊
- 對應 PRD：`docs/prd.md`
- 對應 Epic：`docs/requirements/E-001-core-product-experience.md`
- 對應需求：`E-001-001 核心主流程可用`、`E-001-003 第一版範圍邊界清楚`
- 文件目的：把目前已可用的音檔轉錄主流程整理成正式技術設計，讓需求文件與現況對齊。

## 1. 設計目標
- 保持「音檔上傳 -> 背景轉錄 -> 查詢狀態 -> 取得 TXT / SRT」為第一版主流程。
- 以前後端分離的 task-based API 支撐較長時間的轉錄作業。
- 讓前端經由 Next.js API route 代理後端，避免直接暴露 backend 位置與跨網域細節。

## 2. 系統/功能架構

```text
Next.js Page
├─ Upload / status / result UI
├─ /api/transcribe proxy routes
└─ FastAPI /transcribe router
   ├─ task registry (in-memory)
   ├─ background process monitor
   └─ transcribe worker
      ├─ Faster-Whisper
      ├─ punctuation restoration
      └─ TXT / SRT generation
```

## 3. 主要模組責任
- `frontend/src/app/page.tsx`
  - 提供音檔上傳、語言選擇、輪詢狀態、顯示 TXT / SRT、複製與下載結果。
- `frontend/src/app/api/transcribe/*`
  - 代理 upload、status、result、cancel、tasks、convert-traditional 到 backend。
- `frontend/src/lib/api-client.ts`
  - 集中處理對 backend 的 HTTP 請求與 base URL。
- `api/src/routers/transcribe.py`
  - 定義 task schema、建立背景任務、管理 task 狀態、提供結果與取消操作。
- `api/src/workers/transcribe_worker.py`
  - 執行 Whisper 轉錄、文字整理、標點還原與 TXT / SRT 輸出。
- `api/src/utils/text_conversion.py`
  - 提供簡繁轉換與文字處理輔助能力。

## 4. 資料流與狀態流
- 使用者在前端選擇音檔並送出 `POST /api/transcribe`。
- Next.js route 轉發 multipart request 到 backend `/transcribe`。
- Backend 建立 task id、啟動背景 process，並把 task state 放入 in-memory registry。
- 前端定期查詢 `/api/transcribe/{taskId}/status`。
- 背景 worker 完成後，backend 在 task result 中寫入 `txt` 與 `srt`。
- 前端在狀態完成後呼叫 `/api/transcribe/{taskId}/result` 讀取結果並渲染。
- 若使用者需要繁體中文版本，前端可把結果再送往 `/api/transcribe/convert-traditional`。

## 5. 關鍵技術決策
- 決策 1：轉錄採背景任務模型，而非同步請求。
  - 原因：音檔轉錄耗時不可預期，同步請求容易超時並惡化 UX。
- 決策 2：task state 目前採 in-memory registry。
  - 原因：先以最小成本支撐單機 MVP；代價是重啟後狀態不保留，也不適合多實例擴展。
- 決策 3：TXT 與 SRT 同時由 worker 產生。
  - 原因：一次轉錄產出兩種主要結果格式，減少重算。
- 決策 4：前端透過 Next.js API proxy 呼叫 backend。
  - 原因：統一前端呼叫入口，也降低直接暴露 backend URL 的耦合。

## 6. 錯誤處理與降級策略
- 若建立 task 失敗，backend 直接回傳錯誤，前端不進入輪詢。
- 若 task 轉錄失敗，status endpoint 應回傳可辨識失敗狀態，前端顯示錯誤訊息。
- 若 result 讀取失敗，前端保留失敗狀態並停止把該任務視為成功完成。
- 若繁體轉換失敗，不影響既有 TXT / SRT 原始結果。

## 7. 測試策略
- 單元測試
  - 驗證 TXT / SRT 生成邏輯與時間戳格式。
  - 驗證文字處理與繁體轉換輔助函式。
- 整合測試
  - 驗證 `/transcribe`、`/status`、`/result`、`/cancel` 等 API contract。
  - 驗證 Next.js proxy routes 與 backend endpoint 對應關係。
- 人工驗收
  - 上傳一個可轉錄音檔。
  - 確認 UI 會顯示處理中與完成狀態。
  - 確認可讀到 TXT / SRT，且至少一種格式可下載。

## 8. 風險與限制
- task state 目前只存在記憶體，服務重啟後結果不保留。
- 轉錄 worker 與前端結果讀取流程仍需持續驗證 race condition 與失敗狀態 contract。
- README 與部分設定宣告可能尚未完全對齊實作，後續需要補校正。
- 前端自動化測試目前不足，驗證仍偏向 backend 與人工流程。

## 9. 未決問題
- 是否要把影音轉音訊正式納入同一個 MVP spec，或維持為相鄰工具。
- task result 是否要改為可重複讀取或持久化，而不是一次性記憶體結果。
- 轉錄模型與 runtime 設定是否要正式做成可配置能力，而不是只依賴現有硬編碼行為。
