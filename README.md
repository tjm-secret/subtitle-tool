# Subtitle Tool

`subtitle-tool` 是一個以 Web 為主的音檔處理工具，主流程聚焦在：

1. 上傳音檔
2. 取得逐字稿 TXT 與字幕 SRT
3. 在同一頁把逐字稿整理成結構化會議記錄

目前 repo 也保留「影片轉音檔」輔助頁面，但正式 MVP 仍以「音檔轉錄 -> TXT / SRT -> 會議記錄」為核心。

## 核心能力

- 音檔上傳、背景轉錄與任務進度查詢
- TXT / SRT 結果查看、複製與下載
- 逐字稿整理成 `摘要`、`重點討論`、`決議事項`、`未決議事項`、`待辦事項`
- 會議記錄匯出為 `Markdown` 與 `DOCX`
- 開發模式提供 mock transcribe 流程，前端驗證不必依賴本機 Whisper
- 額外提供影片轉音檔頁面作為輔助工具

## Repo 結構

```text
subtitle-tool/
├── AGENTS.md                         # Repo 工作流程與 agent 規範
├── README.md                         # 專案入口與操作說明
├── package.json                      # Root npm scripts
├── package-lock.json                 # Root lockfile
├── api/                              # FastAPI backend
│   ├── env.template                  # API / meeting notes 環境變數模板
│   ├── requirements.txt
│   ├── src/
│   │   ├── whisper_api.py            # API 入口
│   │   ├── routers/                  # transcribe / convert routes
│   │   ├── services/meeting_notes.py # 會議記錄 provider 邏輯
│   │   └── models/meeting_notes.py   # 會議記錄 schema
│   └── tests/
├── frontend/                         # Next.js 15 + React 19 前端
│   ├── src/app/page.tsx              # 音檔轉錄 / 會議記錄主頁
│   ├── src/app/video-converter/      # 影片轉音檔頁面
│   └── src/lib/                      # mock、meeting notes helpers
└── docs/
    ├── requirements/                 # Epic 與需求追蹤
    ├── prd.md                        # 正式產品規格
    ├── tdd.md                        # 正式技術設計
    └── plans/                        # 執行計畫
```

## 快速開始

### 1. 安裝依賴

```bash
npm install
cd api && pip install -r requirements.txt
```

### 2. 建立 backend 環境變數

如果你只想驗證前端主流程，這一步可以先略過。若要跑真實 backend 或會議記錄生成，先建立 `.env`：

```bash
cp api/env.template api/.env
```

### 3. 啟動開發環境

預設開發模式只啟前端，並使用 mock transcribe / meeting notes 流程：

```bash
npm run dev:all
```

前端會跑在 [http://localhost:8002](http://localhost:8002)。

## 開發模式

### `npm run dev:all`

- 預設開發入口
- 只啟動前端
- `DEV_TRANSCRIBE_MOCK=true`
- 適合驗證 UI、結果區、會議記錄工作檯與下載流程

### `npm run dev:all:real`

```bash
npm run dev:all:real
```

- 同時啟動前端與 FastAPI backend
- 前端：`http://localhost:8002`
- backend：`http://localhost:8010`
- 適合驗證真實 transcribe task 流程

### `npm run dev:all:mock-full`

```bash
npm run dev:all:mock-full
```

- 啟動前端 mock + backend fallback
- 適合同時驗證前端主流程與部分 backend 設定

### 常用指令

```bash
npm run dev:fe
npm run dev:fe:mock
npm run dev:api
npm run dev:api:mock
npm run build:all
npm run start:all
```

JavaScript 正式工作流一律以 `npm` 為準。

## Production Backend

正式環境建議把 Python 依賴獨立到 `api/.venv.prod`：

```bash
python3 -m venv api/.venv.prod
api/.venv.prod/bin/pip install -r api/requirements.txt
cp api/env.template api/.env.prod
```

至少需要設定：

```bash
MEETING_NOTES_API_BASE=...
MEETING_NOTES_API_KEY=...
MEETING_NOTES_MODEL=...
MEETING_NOTES_DEV_FALLBACK=false
```

若是首次部署，建議先預熱 Whisper 與中文標點模型：

```bash
source api/.venv.prod/bin/activate
python -c "from faster_whisper import WhisperModel; WhisperModel('large-v3', device='cpu', compute_type='int8')"
python -c "from transformers import AutoModelForTokenClassification, AutoTokenizer; m='p208p2002/zh-wiki-punctuation-restore'; AutoTokenizer.from_pretrained(m); AutoModelForTokenClassification.from_pretrained(m)"
```

啟動 backend：

```bash
cd /Users/steve/Documents/GitHub/subtitle-tool
source api/.venv.prod/bin/activate
set -a
source api/.env.prod
set +a
uvicorn api.src.whisper_api:app --host 0.0.0.0 --port 8010 --workers 1
```

## 環境變數

模板檔在 `api/env.template`。常用項目如下：

### 轉錄與資源控制

```bash
MAX_CONCURRENT_TASKS=3
MAX_CONCURRENT_CONVERT_TASKS=2
WHISPER_MODEL_SIZE=base
WHISPER_DEVICE=cpu
```

### 會議記錄 provider

```bash
MEETING_NOTES_API_BASE=
MEETING_NOTES_API_KEY=
MEETING_NOTES_MODEL=
MEETING_NOTES_TIMEOUT_SECONDS=30
```

### 檔案與轉檔

```bash
MAX_FILE_SIZE=104857600
CHUNK_SIZE=5242880
DEFAULT_DENOISE=false
DEFAULT_AUDIO_QUALITY=medium
DEFAULT_AUDIO_FORMAT=mp3
```

## 測試與驗證

前端：

```bash
npm run lint --workspace frontend
node --test frontend/src/lib/meeting-notes.test.js frontend/src/lib/dev-transcribe-mock.test.js
```

後端：

```bash
cd api && pytest
```

如果你只是在調整文件，至少確認 `README.md`、`package.json`、`docs/prd.md`、`docs/tdd.md` 之間沒有互相矛盾。

## 正式文件入口

- 需求入口：[docs/requirements/README.md](./docs/requirements/README.md)
- 產品規格：[docs/prd.md](./docs/prd.md)
- 技術設計：[docs/tdd.md](./docs/tdd.md)
- 執行計畫：[docs/plans/README.md](./docs/plans/README.md)
- Agent 工作規則：[AGENTS.md](./AGENTS.md)

## 補充說明

- `.kickdoc/agent-config.json` 目前宣告的 UI dev server 指令是 `npm run dev:all`。
- `frontend/` 是唯一 npm workspace；`api/` 不是 JavaScript workspace。
- 若 README、PRD、TDD 與實作出現衝突，請先以 `docs/prd.md` 為準，再同步修正其他文件。
