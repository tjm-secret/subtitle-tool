const SENTENCE_BREAK = /(?<=[。！？!?])\s*/u

const DECISION_KEYWORDS = ["決定", "確認", "採用", "結論", "拍板", "定案"]
const PENDING_KEYWORDS = ["待確認", "未決議", "未定案", "待定", "再確認", "仍需討論", "尚未決定", "還沒定案"]
const ACTION_KEYWORDS = ["待辦", "負責", "下週", "跟進", "action", "安排", "處理", "提交"]

function normalizeTranscript(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function splitSentences(text) {
  return normalizeTranscript(text)
    .split(SENTENCE_BREAK)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function includesKeyword(sentence, keywords) {
  return keywords.some((keyword) => sentence.includes(keyword))
}

function unique(items) {
  return [...new Set(items.filter(Boolean))]
}

function toBulletLines(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "- 無"
  }

  return items.map((item) => `- ${String(item || "").trim()}`).join("\n")
}

function pad2(value) {
  return String(value).padStart(2, "0")
}

function formatTimestamp(input) {
  const now = input instanceof Date ? input : new Date(input || Date.now())
  const year = now.getFullYear()
  const month = pad2(now.getMonth() + 1)
  const day = pad2(now.getDate())
  const hours = pad2(now.getHours())
  const minutes = pad2(now.getMinutes())
  return `${year}-${month}-${day}-${hours}${minutes}`
}

function sanitizeSourceName(sourceName) {
  const normalized = String(sourceName || "")
    .replace(/\.[^.]+$/u, "")
    .trim()
    .replace(/[()（）[\]【】{}]/gu, "")
    .replace(/[^\p{L}\p{N}\s_-]+/gu, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")

  return normalized || "meeting"
}

export function buildMeetingNotes(transcript) {
  const sentences = splitSentences(transcript)

  if (sentences.length === 0) {
    return {
      summary: "",
      discussion_points: [],
      decisions: [],
      pending_items: [],
      action_items: [],
    }
  }

  const pendingItems = unique(
    sentences.filter((sentence) => includesKeyword(sentence, PENDING_KEYWORDS)),
  )
  const decisions = unique(
    sentences.filter((sentence) => !pendingItems.includes(sentence) && includesKeyword(sentence, DECISION_KEYWORDS)),
  )
  const actionItems = unique(sentences.filter((sentence) => includesKeyword(sentence, ACTION_KEYWORDS)))

  const discussionPoints = unique(
    sentences
      .filter(
        (sentence) =>
          !decisions.includes(sentence) && !pendingItems.includes(sentence) && !actionItems.includes(sentence),
      )
      .slice(0, 4),
  )

  const summary = unique([sentences[0], ...discussionPoints.slice(0, 1), ...decisions.slice(0, 1)])
    .join(" ")
    .trim()

  return {
    summary,
    discussion_points: discussionPoints,
    decisions,
    pending_items: pendingItems,
    action_items: actionItems,
  }
}

export function getMeetingNotesViewState({ transcript, meetingNotes }) {
  const hasTranscript = normalizeTranscript(transcript).length > 0

  if (!hasTranscript) {
    return {
      disabled: true,
      badge: "需先完成轉錄",
    }
  }

  if (!meetingNotes) {
    return {
      disabled: false,
      badge: "可產生整理稿",
    }
  }

  return {
    disabled: false,
    badge: "已建立整理稿",
  }
}

export function formatMeetingNotesForExport(meetingNotes) {
  const draft = meetingNotes || {
    summary: "",
    discussion_points: [],
    decisions: [],
    pending_items: [],
    action_items: [],
  }

  return [
    "# 會議記錄",
    "",
    "## 摘要",
    draft.summary || "無",
    "",
    "## 重點討論",
    toBulletLines(draft.discussion_points),
    "",
    "## 決議事項",
    toBulletLines(draft.decisions),
    "",
    "## 未決議事項",
    toBulletLines(draft.pending_items),
    "",
    "## 待辦事項",
    toBulletLines(draft.action_items),
  ].join("\n")
}

export function buildMeetingNotesFilename({ sourceName, extension, now } = {}) {
  const safeSourceName = sanitizeSourceName(sourceName)
  const safeExtension = String(extension || "md").replace(/^\.+/u, "") || "md"
  const timestamp = formatTimestamp(now)
  return `${safeSourceName}_meeting-notes_${timestamp}.${safeExtension}`
}

export async function buildMeetingNotesDocxBlob(meetingNotes) {
  const { Document, Packer, Paragraph, TextRun } = await import("docx")

  const draft = meetingNotes || {
    summary: "",
    discussion_points: [],
    decisions: [],
    pending_items: [],
    action_items: [],
  }

  const makeSectionTitle = (title) =>
    new Paragraph({
      spacing: { before: 280, after: 120 },
      children: [new TextRun({ text: title, bold: true, size: 28 })],
    })

  const makeBulletParagraphs = (items) => {
    const list = Array.isArray(items) && items.length > 0 ? items : ["無"]
    return list.map(
      (item) =>
        new Paragraph({
          text: String(item || "").trim() || "無",
          bullet: { level: 0 },
          spacing: { after: 80 },
        }),
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            spacing: { after: 220 },
            children: [new TextRun({ text: "會議記錄", bold: true, size: 36 })],
          }),
          makeSectionTitle("摘要"),
          new Paragraph({
            text: draft.summary || "無",
            spacing: { after: 120 },
          }),
          makeSectionTitle("重點討論"),
          ...makeBulletParagraphs(draft.discussion_points),
          makeSectionTitle("決議事項"),
          ...makeBulletParagraphs(draft.decisions),
          makeSectionTitle("未決議事項"),
          ...makeBulletParagraphs(draft.pending_items),
          makeSectionTitle("待辦事項"),
          ...makeBulletParagraphs(draft.action_items),
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}
