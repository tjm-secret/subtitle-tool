# AGENTS 規範（強制）

## 0) 角色分工
- `AGENTS.md`：定義 agent 在本 repo 的工作規則、文件流程與 skill 使用時機。
- `docs/`：承載專案內的需求、設計、追蹤、計畫與參考文件。
- `docs/requirements/`：需求入口；`README.md` 管理 Epic 索引，`E-xxx-*.md` 管理大型主題正文與其子需求。
- `skills`：屬於 repo 外安裝的能力模組，用來告訴 agent「怎麼做事」，不承載專案本身的正式規格。
- agent 進入 repo 後，應先讀 `AGENTS.md`，再依規則進入 `docs/`；需要額外能力時，再依 `AGENTS.md` 指示使用或安裝對應 skills。

## 1) AI 使用流程
- 每次使用 AI 前，必須先使用 `using-superpowers`。
- `using-superpowers` 的目的為先完成 skill routing 與流程判斷；若本次只是簡單查詢、狀態確認、單純說明或輕量文件整理，完成 skill routing 後可直接簡短回覆，不必額外展開重流程。
- 若未先使用 `using-superpowers`，視為流程不合規，需立即中止並重啟正確流程。
- skills 只提供通用流程模板；若 skill 模板、預設話術、handoff 格式與本 repo 的 `AGENTS.md` 衝突，一律以 `AGENTS.md` 為最高優先。
- 當 `AGENTS.md` 已明確指定預設決策或預設路徑時，agent 必須直接採用，不得再次向使用者詢問相同決策。

### 問題 / 需求分流（強制）
- agent 在進入 `meeting notes / epic -> PRD -> TDD -> 開發` 主流程前，必須先判斷本次輸入屬於「問題 / 查詢」還是「需求 / 變更」。
- 若屬於「問題 / 查詢」，例如概念說明、現況確認、文件解讀、原因分析、輕量建議、指令解釋，agent 應在完成 skill routing 後直接回答，不得強行啟動需求文件流程。
- 若屬於「需求 / 變更」，例如新增功能、修改規則、調整文件制度、修 bug、補測試、更新 UI、改 CLI 行為，agent 才可進入正式需求流程。
- 若同一輪同時包含問題與需求，agent 應先簡短回答問題，再將可執行的需求部分導入正式流程。
- 若判斷不確定，預設先視為「問題 / 查詢」並做最小澄清；只有在明確涉及可交付變更時，才升級為「需求 / 變更」。

## 2) 開發主流程（固定順序）
- 使用情境先分三類：`init` 用於全新專案建立、`adopt` 用於既有專案第一次導入、`upgrade` 用於已導入 Kickdoc 的專案升級。
- 所有新討論或會議結論，先更新對應 `docs/requirements/E-xxx-*.md`；若尚無合適 Epic，先建立新的 Epic 檔案，並同步更新 `docs/requirements/README.md`。
- 若是既有專案導入，先整理現有 Markdown 到 `docs/adoption-brief.md`，再將可用內容收斂進對應 `docs/requirements/E-xxx-*.md`。
- 所有需求都必須先寫入 `docs/prd.md`，再寫入 `docs/tdd.md`，才可以開始開發。
- 在目前單人模式下，主目錄是正式 `docs/requirements/`、`docs/prd.md`、`docs/tdd.md` 的工作區；正式 spec 一律先在主目錄更新。
- 只有 Epic 內的子需求可以升級進入 PRD；`Epic` 不可直接進入 PRD / TDD。
- 固定順序為：`PRD -> TDD -> 開發`。
- 若需求不清楚，必須先釐清後再寫入 PRD。
- 後續執行順序一律為：`meeting notes / epic -> PRD -> TDD -> worktree 開發`。
- 新專案流程：`meeting notes -> Epic -> PRD -> TDD -> 開發`
- 既有專案流程：`existing md -> adoption-brief -> Epic -> PRD -> TDD -> 開發`
- 已導入專案升級流程：`doctor -> upgrade -> review managed files -> 繼續開發`
- `adoption-brief` 不是 `meeting notes`，只能作為整理既有文件的導入摘要，不可直接視為正式需求。

### PRD / TDD 編輯規範（強制）
- 每次修改 `docs/prd.md` 或 `docs/tdd.md` 前，必須先從檔頭重新閱讀整份文件，不得只讀尾段、局部片段或直接 append。
- `docs/prd.md` 與 `docs/tdd.md` 屬於正式 spec，不是累積式筆記；新增需求時必須先檢查整體結構、段落層級、既有內容與本次需求是否衝突。
- 若 `docs/prd.md` 或 `docs/tdd.md` 仍含 template heading、placeholder、撰寫提示或示意段落，進入正式需求後必須先清除或改寫為正式內容，不得保留模板與正式規格混寫。

### 文件狀態與升級條件（強制）
- `docs/requirements/` 屬於需求盤點與收斂區，用來承接 meeting notes、想法、需求清單與 Epic / 子需求整理；此階段允許未完成資訊，但必須標示已定案、待釐清、未開始等狀態。
- `docs/prd.md` 屬於正式產品規格；只有已定案、範圍具體、可驗收的子需求可以升級進入 PRD。PRD 必須描述產品目標、使用者體驗、範圍與驗收標準，不承載純技術實作細節。
- `docs/tdd.md` 屬於正式技術設計；只有已存在於 PRD 的需求才可進入 TDD。TDD 必須承接 PRD 並補上模組責任、資料流、技術決策、錯誤處理與測試策略。
- `docs/plans/` 屬於執行計畫；只有在 PRD 與 TDD 都已更新完成後，才可寫 plan 並安排實作順序。plan 不可反向取代 PRD / TDD 成為權威規格來源。
- 開始開發前，必須至少確認：對應需求已存在於 Epic、PRD 已在主目錄更新、TDD 已在主目錄更新、是否需要 `writing-plans` 已判定完成；任一項未完成，都不得直接進入實作。

## 3) 規格衝突處理（權威來源）
- PRD 為最高權威。
- 若 PRD、TDD、測試、實作出現衝突，以 PRD 為準，並同步修正其餘內容。

## 4) `writing-plans` 觸發規則
- `docs/prd.md` 與 `docs/tdd.md` 完成後，符合以下任一條件時，**必須**先調用 `writing-plans`，再進入實作：
  - 任務包含 2 個以上檔案修改，或同時包含文件 + 程式 + 測試變更。
  - 任務需要跨元件/跨頁狀態或互動流程調整（例如 UI 顯示邏輯、模式切換、控制列顯示條件）。
  - 任務涉及新互動模式、新流程，或會影響既有驗收標準。
  - 使用者明確點名 `writing-plans` skill。
- 若不確定是否屬於複雜任務，預設視為複雜，先用 `writing-plans`。
- 即使是非複雜任務，仍需先完成一次簡要規劃思考後才能實作。

## 5) 計畫執行規範
- `writing-plans` 完成後，即可進入計畫執行階段（可使用 `executing-plans` 或你明確指定的執行方式）。
- 若需在「1) Subagent-Driven（本 session）」與「2) Parallel Session（獨立 session）」二選一，且你未特別指定時，預設一律使用 1) Subagent-Driven，不需再額外詢問。
- 若 skill 模板在計畫完成後要求再次詢問執行方式、handoff 選項或其他已由 `AGENTS.md` 定義的預設決策，agent 必須略過該詢問並直接依本規範執行。
- 進入計畫執行後，原則上應完成該 plan 的全部 tasks；僅在以下情況可暫停：
  - 遇到 blocker。
  - 發生需求衝突且需你決策。
  - 你明確要求中止或改道。
- 只有你明確下達開發指令後才開始實作。

## 6) UI 改動同步規範
- 若有任何 UI 改動，必須同步更新 `docs/prd.md` 中對應的 ASCII 內容。

## 7) 工作樹隔離規範（強制）
- 每次開始「新需求」前，必須先檢查目前工作樹是否乾淨：`git status --porcelain`。
- 新需求的正式 `requirements / PRD / TDD` 更新預設在主目錄進行；worktree 的主要用途是隔離實作、測試與驗證。
- 若有任何未提交變更（包含 tracked 或 untracked 檔案），視為前一任務仍在進行中：
  - 不可直接在當前工作樹開發新需求。
  - 必須先建立並切換到新的 `git worktree` 後再開工。
- 若當前工作樹為乾淨狀態，才可直接在當前工作樹開發；若仍決定使用 worktree，也必須遵守以下規範。

### 新需求觸發定義
- 「新需求」指：開始處理不同目標的任務（例如新 ticket、新 issue、新功能、獨立 bugfix）。
- 只要進入新需求，第一步必須先執行 `git status --porcelain` 檢查工作樹狀態。
- 若本次新需求包含正式 spec 變更，必須先在主目錄完成 `docs/requirements/`、`docs/prd.md`、`docs/tdd.md` 更新，再進入 worktree 實作。

### 分支命名規範（worktree）
- 以 worktree 開工時，必須使用新分支，命名格式：`codex/<task-name>`。
- `<task-name>` 使用小寫英文與 `-`，避免空白與特殊符號。
- 若為同主題迭代，可在尾碼加序號（例如：`codex/endcap-outro-video-2`）。

### 預設位置策略（worktree）
- worktree 預設建立在 repo 內的專用資料夾：`.worktrees/<branch-name>`。
- 若因磁碟配置、跨 repo 協作或其他明確原因需使用非預設位置，可以例外，但 agent 必須在回報中明確寫出實際 path 與原因。
- `.worktrees/` 是 worktree 容器，不是 repo 正式內容的一部分，必須加入 `.gitignore`。
- 規範的重點是「可定位」而不是限制 worktree 只能在 repo 內或 repo 外；任何例外位置都必須讓使用者可直接找到。

### 完工收尾順序（worktree）
- worktree 任務完成後，固定順序為：`push 分支 -> 驗證已 merge 到目標分支 -> 決定保留或刪除 worktree`。
- 不得跳過 `push` 就宣稱任務已完成；也不得在確認 merge 之前先刪除 worktree。
- 若目標分支未特別指定，預設為 `main`。

### worktree 生命週期
- 新需求完成後，worktree 先保留，不得立即刪除。
- 僅在以下條件同時成立時，才可刪除 worktree：
  - 該 worktree 的變更已**完成合併（merge）**到目標分支。
  - 使用者明確下達刪除指令（例如：「可以刪除 worktree」）。
- 未收到明確刪除指令前，一律保持 worktree 存在。

### 開發中發現 spec 變更
- 若 worktree 開發中發現需求、驗收標準、流程規則或技術設計需要調整，必須先暫停實作。
- 正式 spec 需回主目錄更新 `docs/requirements/`、`docs/prd.md`、`docs/tdd.md`；必要時再補 `docs/plans/`。
- 正式 spec 更新完成後，才可回到 worktree 繼續實作。
- worktree 中的臨時筆記、草稿或驗證內容，不得視為正式 spec 權威來源。

## 8) 完工後啟動開發伺服器（強制）
- 僅在「本次有修改 repo 內檔案，且包含 UI 變動」時，才需要檢查 repo 的顯式開發伺服器宣告。
- dev server command 一律讀取 `.kickdoc/agent-config.json`，不得自行猜測 `npm` / `pnpm` / `yarn` / `bun` 或 script 名稱。
- 若 `.kickdoc/agent-config.json` 的 `ui.devServer.mode` 為 `command`，才執行其中宣告的 command。
- 若 `mode` 為 `not_applicable`，代表該 repo 明確不需要此能力，可合法跳過。
- 若 `mode` 為 `unconfigured` 或設定缺失，需明確回報缺少設定，不得自行猜測命令。
- `UI 變動` 指任何會影響使用者可見畫面、前端互動或瀏覽流程的修改，例如：頁面、元件輸出、樣式、版型、前端路由、互動邏輯、顯示文案、設計 token、以及會直接影響畫面輸出的 template。
- 下列情況預設不算 `UI 變動`：純文件、純資料整理、CLI / 後端-only 變更、測試-only 變更、build / script 調整、以及只改內部重構且不影響畫面輸出的修改。
- 若本次變更不涉及 UI（如文件、純 render、純資料整理、套件安裝、非 UI 調整），不得檢查或啟動 dev server。
- 若開發伺服器已在執行，需回報既有 URL 與 session；不得重複啟動。若啟動失敗，需立即回報原因並提供替代方案。

## 9) Skills 使用規範
- 本專案會使用：`superpowers`、`requirements-tracking`、`frontend-design`、`wrangler`、`playwright`。
- 涉及 `meeting notes`、需求盤點、Epic 更新時，必須使用 `requirements-tracking`。
- 涉及需求盤點或大型主題時，必須建立 / 更新對應 `docs/requirements/E-xxx-*.md`，並同步更新 `docs/requirements/README.md` 索引。
- skills 本體不放進 repo；repo 內只記錄「要用哪些 skills、何時使用、去哪裡安裝或取得」。
- 若要把本 repo 抽成其他專案模板，優先複用 `AGENTS.md` 的 skill 規則與安裝來源，不複製整份 skill 內容。
