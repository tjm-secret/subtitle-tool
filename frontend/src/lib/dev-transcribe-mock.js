import { randomUUID } from "node:crypto"

const TASK_DURATION_MS = 2600

function getStore() {
  if (!globalThis.__transcribeMockStore) {
    globalThis.__transcribeMockStore = new Map()
  }

  return globalThis.__transcribeMockStore
}

function buildMockTranscript(filename) {
  return [
    `今天的音檔主題是 ${filename} 的逐字稿整理。`,
    "這次會議主要討論轉錄結果區要怎麼加入會議記錄整理功能。",
    "我們決定先做前端-only 版本，讓 dev server 可以直接展示完整互動。",
    "接著會保留 TXT 與 SRT，並在右側新增整理後的摘要、重點討論、決議事項與待辦事項。",
    "下週由 Steve 負責把 mock transcribe 流程接回頁面，並確認使用者可以直接編輯整理稿。",
  ].join("")
}

function buildMockSrt() {
  return [
    "1",
    "00:00:00,000 --> 00:00:04,000",
    "這次會議主要討論轉錄結果區要怎麼加入會議記錄整理功能。",
    "",
    "2",
    "00:00:04,000 --> 00:00:08,000",
    "我們決定先做前端-only 版本，讓 dev server 可以直接展示完整互動。",
    "",
    "3",
    "00:00:08,000 --> 00:00:12,000",
    "下週由 Steve 負責把 mock transcribe 流程接回頁面。",
  ].join("\n")
}

function computeStatus(task) {
  if (task.status === "cancelled") {
    return { ...task, progress: task.progress ?? 0 }
  }

  const elapsed = Date.now() - task.startedAt

  if (elapsed >= TASK_DURATION_MS) {
    return { ...task, status: "completed", progress: 100 }
  }

  return {
    ...task,
    status: "running",
    progress: Math.min(94, Math.max(8, Math.round((elapsed / TASK_DURATION_MS) * 100))),
  }
}

export function isDevMockEnabled() {
  if (process.env.DEV_TRANSCRIBE_MOCK === "true") {
    return true
  }

  if (process.env.DEV_TRANSCRIBE_MOCK === "false") {
    return false
  }

  return process.env.NODE_ENV === "development"
}

export function startMockTask({ filename, language = "auto", denoise = false }) {
  const taskId = randomUUID()
  const task = {
    task_id: taskId,
    filename,
    language,
    denoise,
    startedAt: Date.now(),
    created_at: new Date().toISOString(),
    status: "running",
    progress: 0,
    result: {
      txt: buildMockTranscript(filename),
      srt: buildMockSrt(),
      detected_language: language === "auto" ? "zh" : language,
      noise_reduction_applied: denoise,
      status: "completed",
    },
  }

  getStore().set(taskId, task)
  return task
}

export function getMockTask(taskId) {
  const task = getStore().get(taskId)
  if (!task) return null

  const computed = computeStatus(task)
  getStore().set(taskId, computed)
  return computed
}

export function listMockTasks() {
  return [...getStore().values()]
    .map((task) => getMockTask(task.task_id))
    .filter(Boolean)
    .filter((task) => task.status === "running")
    .map((task) => ({
      task_id: task.task_id,
      filename: task.filename,
      language: task.language,
      status: task.status,
      progress: task.progress,
      created_at: task.created_at,
      denoise: task.denoise,
    }))
}

export function cancelMockTask(taskId) {
  const task = getStore().get(taskId)
  if (!task) return null

  const cancelled = { ...task, status: "cancelled", progress: Math.min(task.progress, 96) }
  getStore().set(taskId, cancelled)
  return cancelled
}

export function convertTraditionalFallback({ txt = null, srt = null }) {
  return {
    txt: typeof txt === "string" ? txt : null,
    srt: typeof srt === "string" ? srt : null,
  }
}
