import test from "node:test"
import assert from "node:assert/strict"

import {
  buildMeetingNotes,
  buildMeetingNotesFilename,
  formatMeetingNotesForExport,
  getMeetingNotesViewState,
} from "./meeting-notes.js"

test("buildMeetingNotes returns five structured sections from transcript text", () => {
  const transcript = [
    "今天主要討論首頁改版與會議記錄功能。",
    "我們決定先做前端-only 版本，backend 之後再補。",
    "發布時程還沒定案，需等設計 review 後再確認。",
    "下週由 Steve 負責把 mock transcribe 流程接到 dev server。",
    "另外確認結果區要保留 TXT、SRT 跟整理稿並列。",
  ].join("")

  const result = buildMeetingNotes(transcript)

  assert.equal(typeof result.summary, "string")
  assert.ok(result.summary.length > 0)
  assert.ok(Array.isArray(result.discussion_points))
  assert.ok(Array.isArray(result.decisions))
  assert.ok(Array.isArray(result.pending_items))
  assert.ok(Array.isArray(result.action_items))
  assert.ok(result.decisions.some((item) => item.includes("前端-only")))
  assert.ok(result.pending_items.some((item) => item.includes("還沒定案")))
  assert.ok(result.action_items.some((item) => item.includes("Steve")))
})

test("getMeetingNotesViewState disables meeting notes tab before transcript exists", () => {
  const result = getMeetingNotesViewState({ transcript: "", meetingNotes: null })

  assert.equal(result.disabled, true)
  assert.equal(result.badge, "需先完成轉錄")
})

test("getMeetingNotesViewState marks draft-ready transcript before notes are generated", () => {
  const result = getMeetingNotesViewState({
    transcript: "這是一段可整理的逐字稿。",
    meetingNotes: null,
  })

  assert.equal(result.disabled, false)
  assert.equal(result.badge, "可產生整理稿")
})

test("formatMeetingNotesForExport returns a readable five-section memo", () => {
  const output = formatMeetingNotesForExport({
    summary: "這次會議確認首頁資訊架構要改版。",
    discussion_points: ["主 tab 改成轉錄文件與會議記錄", "任務管理降成次要資訊"],
    decisions: ["先做 frontend-only，不改 backend"],
    pending_items: ["發布日期仍待 PM 最後確認"],
    action_items: ["今天完成 UI 微調與匯出能力"],
  })

  assert.match(output, /# 會議記錄/)
  assert.match(output, /## 摘要/)
  assert.match(output, /## 重點討論/)
  assert.match(output, /## 決議事項/)
  assert.match(output, /## 未決議事項/)
  assert.match(output, /## 待辦事項/)
  assert.match(output, /- 主 tab 改成轉錄文件與會議記錄/)
})

test("buildMeetingNotesFilename keeps source name recognizable and appends timestamp", () => {
  const filename = buildMeetingNotesFilename({
    sourceName: "團隊週會 (final).mp3",
    extension: "docx",
    now: new Date("2026-03-19T09:42:00+08:00"),
  })

  assert.equal(filename, "團隊週會-final_meeting-notes_2026-03-19-0942.docx")
})
