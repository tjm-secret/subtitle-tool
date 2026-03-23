"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/sonner"
import { 
  Upload, 
  FileAudio, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Subtitles, 
  Volume2, 
  Languages,
  X,
  Clock,
  Download,
  Copy,
  RefreshCw,
  Sparkles
} from "lucide-react"
import AudioCutter from "@/components/AudioCutter"
import {
  buildMeetingNotes,
  buildMeetingNotesDocxBlob,
  buildMeetingNotesFilename,
  formatMeetingNotesForExport,
  getMeetingNotesViewState,
} from "@/lib/meeting-notes.js"

interface TranscriptionResult {
  srt?: string
  txt?: string
  detected_language?: string
  status?: string
  noise_reduction_applied?: boolean
  [key: string]: unknown
}

interface TaskStatus {
  task_id: string
  status: "running" | "completed" | "error" | "cancelled"
  progress: number
  filename?: string
  created_at?: string
  error_message?: string
}

interface ActiveTask {
  task_id: string
  filename: string
  language?: string
  status: "running" | "completed" | "error" | "cancelled"
  progress: number
  created_at: string
  denoise?: boolean
}

interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

interface HTTPValidationError {
  detail: ValidationError[]
}

interface MeetingNotesDraft {
  summary: string
  discussion_points: string[]
  decisions: string[]
  pending_items: string[]
  action_items: string[]
}

export default function AudioTranscriptionPage() {
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState<string>("auto")
  const [denoise, setDenoise] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [workspaceTab, setWorkspaceTab] = useState<"transcribe" | "meeting-notes">("transcribe")
  const [activeResultTab, setActiveResultTab] = useState<"txt" | "srt">("txt")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isConvertingTraditional, setIsConvertingTraditional] = useState(false)
  
  // 新增状态用于任务管理
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [taskProgress, setTaskProgress] = useState<number>(0)
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([])
  const [meetingNotes, setMeetingNotes] = useState<MeetingNotesDraft | null>(null)
  const [isPreparingMeetingNotes, setIsPreparingMeetingNotes] = useState(false)
  const [meetingNotesError, setMeetingNotesError] = useState<string | null>(null)
  const meetingNotesViewState = getMeetingNotesViewState({
    transcript: result?.txt ?? "",
    meetingNotes,
  })

  // 常用語言列表
  const commonLanguages = [
    { code: "auto", name: "自動偵測" },
    { code: "zh", name: "中文" },
    { code: "en", name: "English" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Português" },
    { code: "ru", name: "Русский" },
    { code: "ar", name: "العربية" },
    { code: "hi", name: "हिन्दी" },
    { code: "th", name: "ไทย" },
    { code: "vi", name: "Tiếng Việt" },
    { code: "tr", name: "Türkçe" },
  ]

  // 獲取活躍任務列表
  const fetchActiveTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/transcribe/tasks")
      if (response.ok) {
        const data = await response.json()
        setActiveTasks(data.active_tasks || [])
      }
    } catch (error) {
      console.error("Failed to fetch active tasks:", error)
    }
  }, [])

  // 輪詢任務狀態
  useEffect(() => {
    if (currentTaskId) {
      const pollStatus = async () => {
        try {
          const response = await fetch(`/api/transcribe/${currentTaskId}/status`)
          if (response.ok) {
            const status: TaskStatus = await response.json()
            setTaskProgress(status.progress)
            
            if (status.status === "completed") {
              // 獲取結果
              const resultResponse = await fetch(`/api/transcribe/${currentTaskId}/result`)
              if (resultResponse.ok) {
                const resultData = await resultResponse.json()
                setResult(resultData)
                setIsLoading(false)
                setCurrentTaskId(null)
                fetchActiveTasks() // 刷新任務列表
                toast("轉錄完成", {
                  description: "音檔已成功轉錄，您可以查看結果並進行編輯。",
                })
              }
            } else if (status.status === "error" || status.status === "cancelled") {
              const errorMsg = status.error_message || `任務${status.status === "error" ? "失敗" : "已取消"}`
              setError(errorMsg)
              setIsLoading(false)
              setCurrentTaskId(null)
              fetchActiveTasks() // 刷新任務列表
              toast.error("轉錄失敗", {
                description: errorMsg,
              })
            }
          }
        } catch (error) {
          console.error("Failed to poll task status:", error)
        }
      }

      const interval = setInterval(pollStatus, 1000) // 每秒輪詢一次
      return () => clearInterval(interval)
    }
  }, [currentTaskId, fetchActiveTasks])

  // 定期刷新活躍任務列表
  useEffect(() => {
    fetchActiveTasks()
    const interval = setInterval(fetchActiveTasks, 5000) // 每5秒刷新一次
    return () => clearInterval(interval)
  }, [fetchActiveTasks])

  // 清理音檔URL以防止記憶體洩漏
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type.startsWith("audio/")) {
        // 清理之前的音檔URL
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }
        
        setFile(droppedFile)
        setError(null)
        const url = URL.createObjectURL(droppedFile)
        setAudioUrl(url)
      } else {
        setError("請選擇音檔文件")
      }
    }
  }, [audioUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type.startsWith("audio/")) {
        // 清理之前的音檔URL
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }
        
        setFile(selectedFile)
        setError(null)
        const url = URL.createObjectURL(selectedFile)
        setAudioUrl(url)
      } else {
        setError("請選擇音檔文件")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("請選擇文件")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setMeetingNotes(null)
    setMeetingNotesError(null)
    setWorkspaceTab("transcribe")
    setActiveResultTab("txt")
    setTaskProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (language && language !== "auto") {
        formData.append("language", language)
      }
      formData.append("denoise", denoise ? "true" : "false")

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 422) {
          const errorData: HTTPValidationError = await response.json()
          const errorMessages = errorData.detail.map((err) => err.msg).join(", ")
          throw new Error(`驗證錯誤: ${errorMessages}`)
        }
        throw new Error(`HTTP錯誤! 狀態: ${response.status}`)
      }

      const data = await response.json()
      if (data.task_id) {
        setCurrentTaskId(data.task_id)
        fetchActiveTasks() // 刷新任務列表
        toast("任務已啟動", {
          description: "正在開始處理您的音檔，請稍候...",
        })
      } else {
        // 兼容舊版本直接返回結果的情況
      setResult(data)
      setMeetingNotes(null)
      setWorkspaceTab("transcribe")
      setIsLoading(false)
      toast("轉錄完成", {
        description: "音檔已成功轉錄。",
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "轉錄過程中發生錯誤"
      setError(errorMsg)
      setIsLoading(false)
      toast.error("轉錄失敗", {
        description: errorMsg,
      })
    }
  }

  const handleCancelTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/transcribe/${taskId}/cancel`, {
        method: "POST",
      })
      if (response.ok) {
        if (taskId === currentTaskId) {
          setCurrentTaskId(null)
          setIsLoading(false)
        }
        fetchActiveTasks() // 刷新任務列表
        toast("任務已取消", {
          description: "轉錄任務已成功取消。",
        })
      }
    } catch (error) {
      console.error("Failed to cancel task:", error)
    }
  }

  const resetForm = () => {
    setFile(null)
    setLanguage("auto")
    setDenoise(false)
    setResult(null)
    setMeetingNotes(null)
    setMeetingNotesError(null)
    setWorkspaceTab("transcribe")
    setActiveResultTab("txt")
    setError(null)
    setCurrentTaskId(null)
    setTaskProgress(0)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    if (!text) {
      toast.error("內容為空", {
        description: "沒有可複製的文字。",
      })
      return
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        // 現代瀏覽器，且在 HTTPS 或 localhost
        await navigator.clipboard.writeText(text)
      } else {
        // 後備方案：在非安全上下文或不支援 clipboard API 時使用
        const textarea = document.createElement("textarea")
        textarea.value = text
        textarea.style.position = "fixed"      // 避免跳動
        textarea.style.left = "-9999px"
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }

      toast("已複製", {
        description: "內容已成功複製到剪貼板。",
      })
    } catch (error) {
      console.error("Copy failed:", error)
      toast.error("複製失敗", {
        description: "無法複製到剪貼板，請手動選擇並複製。",
      })
    }
  }

  const downloadFile = (text: string, format: 'txt' | 'srt') => {
    if (!text) {
      toast.error("內容為空", {
        description: "沒有可下載的內容。",
      })
      return
    }

    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transcription.${format}`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast("下載開始", {
        description: `${format.toUpperCase()} 文件已開始下載。`,
      })
    } catch (err) {
      console.error("Download error:", err)
      toast.error("下載失敗", {
        description: "無法下載文件，請稍後再試。",
      })
    }
  }

  const convertResultToTraditional = async () => {
    if (!result) {
      toast.error("無轉換內容", {
        description: "請先上傳音檔以取得轉錄結果。",
      })
      return
    }

    if (!(result.txt || result.srt)) {
      toast.error("內容為空", {
        description: "目前沒有可轉換的文本。",
      })
      return
    }

    try {
      setIsConvertingTraditional(true)
      const response = await fetch("/api/transcribe/convert-traditional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          txt: result.txt ?? null,
          srt: result.srt ?? null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { detail?: unknown }
        const detail = errorData?.detail
        const message = typeof detail === "string" ? detail : "簡繁轉換失敗"
        throw new Error(message)
      }

      const data = await response.json() as { txt?: string | null; srt?: string | null }
      let nextTxt: string | undefined

      setResult((prev) => {
        if (!prev) return prev
        const updated: TranscriptionResult = { ...prev }
        if (typeof data.txt === "string") {
          updated.txt = data.txt
          nextTxt = data.txt
        }
        if (typeof data.srt === "string") {
          updated.srt = data.srt
        }
        return updated
      })

      setMeetingNotes((prev) => {
        if (!prev) return prev
        return buildMeetingNotes(nextTxt ?? result?.txt ?? "")
      })
      setMeetingNotesError(null)

      toast("已轉為繁體", {
        description: "轉錄內容已轉換為繁體中文。",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "無法轉換為繁體，請稍後再試。"
      toast.error("轉換失敗", {
        description: message,
      })
    } finally {
      setIsConvertingTraditional(false)
    }
  }

  const generateMeetingNotes = async () => {
    if (!result?.txt?.trim()) {
      toast.error("沒有可整理的逐字稿", {
        description: "請先完成轉錄，取得 TXT 結果後再整理會議記錄。",
      })
      return
    }

    try {
      setIsPreparingMeetingNotes(true)
      setMeetingNotesError(null)
      const response = await fetch("/api/transcribe/meeting-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: result.txt,
          source_name: file?.name ?? null,
        }),
      })

      const payload = await response.json().catch(() => ({})) as {
        summary?: string
        discussion_points?: string[]
        decisions?: string[]
        pending_items?: string[]
        action_items?: string[]
        detail?: unknown
      }

      if (!response.ok) {
        const detail = payload?.detail
        const message =
          typeof detail === "string"
            ? detail
            : "會議記錄生成失敗，請檢查後端 provider 設定或稍後再試。"
        throw new Error(message)
      }

      setMeetingNotes({
        summary: payload.summary ?? "",
        discussion_points: payload.discussion_points ?? [],
        decisions: payload.decisions ?? [],
        pending_items: payload.pending_items ?? [],
        action_items: payload.action_items ?? [],
      })
      setWorkspaceTab("meeting-notes")
      toast("已建立整理稿", {
        description: "已切換到會議記錄頁，你可以直接編修摘要、決議與待辦。",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "會議記錄生成失敗"
      setMeetingNotesError(message)
      toast.error("會議記錄生成失敗", {
        description: message,
      })
    } finally {
      setIsPreparingMeetingNotes(false)
    }
  }

  const updateMeetingNotesSummary = (value: string) => {
    setMeetingNotes((prev) => (prev ? { ...prev, summary: value } : prev))
  }

  const updateMeetingNotesList = (key: keyof Omit<MeetingNotesDraft, "summary">, value: string) => {
    setMeetingNotes((prev) =>
      prev
        ? {
            ...prev,
            [key]: value
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          }
        : prev,
    )
  }

  const downloadMeetingNotes = () => {
    if (!meetingNotes) {
      toast.error("尚未建立整理稿", {
        description: "請先產生會議記錄，再下載整理稿。",
      })
      return
    }

    try {
      const text = formatMeetingNotesForExport(meetingNotes)
      const blob = new Blob([text], { type: "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = buildMeetingNotesFilename({
        sourceName: file?.name,
        extension: "md",
      })
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast("下載開始", {
        description: "會議記錄整理稿已開始下載。",
      })
    } catch (error) {
      console.error("Meeting notes download failed:", error)
      toast.error("下載失敗", {
        description: "無法下載整理稿，請稍後再試。",
      })
    }
  }

  const downloadMeetingNotesDocx = async () => {
    if (!meetingNotes) {
      toast.error("尚未建立整理稿", {
        description: "請先產生會議記錄，再下載 DOCX。",
      })
      return
    }

    try {
      const blob = await buildMeetingNotesDocxBlob(meetingNotes)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = buildMeetingNotesFilename({
        sourceName: file?.name,
        extension: "docx",
      })
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast("下載開始", {
        description: "DOCX 會議記錄已開始下載。",
      })
    } catch (error) {
      console.error("Meeting notes DOCX download failed:", error)
      toast.error("DOCX 下載失敗", {
        description: "無法建立 DOCX，請稍後再試。",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge variant="default" className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />進行中</Badge>
      case "completed":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />已完成</Badge>
      case "error":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />失敗</Badge>
      case "cancelled":
        return <Badge variant="secondary"><X className="w-3 h-3 mr-1" />已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">音檔轉錄工具</h1>
        <p className="text-muted-foreground">上傳音檔文件獲取準確的轉錄結果，支持實時進度監控</p>
      </div>

      <Tabs value={workspaceTab} onValueChange={(value) => setWorkspaceTab(value as "transcribe" | "meeting-notes")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transcribe">轉錄文件</TabsTrigger>
          <TabsTrigger value="meeting-notes" disabled={meetingNotesViewState.disabled} className="gap-2">
            會議記錄
            <span className="rounded-full bg-stone-900/90 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-stone-50">
              {meetingNotesViewState.badge}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transcribe" forceMount className="space-y-6 data-[state=inactive]:hidden">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  上傳音檔文件
                </CardTitle>
                <CardDescription>選擇或拖拽音檔文件進行轉錄</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:bg-muted/50 ${dragActive
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-muted-foreground/50"
                          }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <FileAudio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <div className="space-y-2">
                          <span className="text-sm font-medium">點擊上傳或拖拽文件</span>
                          <p className="text-xs text-muted-foreground">支持 MP3、WAV、M4A 等音檔格式</p>
                        </div>
                      </div>
                    </Label>
                    <Input id="file-upload" type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                  </div>
                  
                  {/* Language Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="language-select" className="flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      選擇語言
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇語言或自動檢測" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonLanguages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      選擇音檔的語言，或留空讓系統自動檢測
                    </p>
                  </div>

                  <div className="flex items-start justify-between rounded-lg border p-3">
                    <div className="space-y-1 pr-3">
                      <Label htmlFor="denoise-toggle" className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        啟用降噪
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        勾選後將先透過 FFmpeg 做基礎降噪，再開始轉錄流程。
                      </p>
                    </div>
                    <input
                      id="denoise-toggle"
                      type="checkbox"
                      checked={denoise}
                      onChange={(event) => setDenoise(event.target.checked)}
                      className="h-5 w-5 accent-primary mt-1"
                    />
                  </div>

                  {file && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <FileAudio className="w-4 h-4" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>

                      {audioUrl && (
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Volume2 className="w-4 h-4" />
                            <span className="text-sm font-medium">音檔預覽</span>
                          </div>
                          <div className="mt-4">
                            <AudioCutter
                              file={file}
                              onCut={(cutFile) => {
                                // 釋放舊 audioUrl
                                if (audioUrl) URL.revokeObjectURL(audioUrl)
                                setFile(cutFile)
                                setError(null)
                                const url = URL.createObjectURL(cutFile)
                                setAudioUrl(url)
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" disabled={!file || isLoading} className="flex-1">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          轉錄中...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          開始轉錄
                        </>
                      )}
                    </Button>
                    {(file || result) && (
                      <Button type="button" onClick={resetForm} variant="outline">
                        重置
                      </Button>
                    )}
                    {currentTaskId && (
                      <Button 
                        type="button" 
                        onClick={() => handleCancelTask(currentTaskId)} 
                        variant="destructive"
                      >
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                    )}
                  </div>

                  {isLoading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>轉錄進度</span>
                        <span>{taskProgress}%</span>
                      </div>
                      <Progress value={taskProgress} className="w-full" />
                      <p className="text-sm text-center text-muted-foreground">正在處理您的音檔文件...</p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  轉錄結果
                </CardTitle>
                <CardDescription>轉錄的文本將在這裡顯示</CardDescription>
              </CardHeader>
              <CardContent>
                    {result ? (
                      <div className="space-y-4">
                        {/* Language Detection Result */}
                        {result.detected_language && (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Languages className="w-4 h-4" />
                            <span className="text-sm font-medium">檢測語言:</span>
                            <span className="text-sm text-muted-foreground">
                              {commonLanguages.find(lang => lang.code === result.detected_language)?.name || 
                               result.detected_language}
                            </span>
                          </div>
                        )}
                        {typeof result.noise_reduction_applied !== "undefined" && (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">降噪狀態:</span>
                            <span className="text-sm text-muted-foreground">
                              {result.noise_reduction_applied ? "已啟用" : "未啟用"}
                            </span>
                          </div>
                        )}

                        {audioUrl && (
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Volume2 className="w-4 h-4" />
                              <span className="text-sm font-medium">原始音檔</span>
                            </div>
                            <audio
                              key={audioUrl}
                              controls
                              className="w-full"
                              preload="metadata"
                            >
                              <source src={audioUrl} type={file?.type} />
                              您的瀏覽器不支持音檔播放器。
                            </audio>
                          </div>
                        )}

                        {/* Format Tabs */}
                        <Tabs
                          value={activeResultTab}
                          onValueChange={(value) => setActiveResultTab(value as "txt" | "srt")}
                          className="space-y-3"
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="txt" className="gap-2">
                              <FileText className="w-4 h-4" />
                              純文本
                            </TabsTrigger>
                            <TabsTrigger value="srt" className="gap-2">
                              <Subtitles className="w-4 h-4" />
                              SRT字幕
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="txt" forceMount className="data-[state=inactive]:hidden">
                            <div className="p-4 bg-muted rounded-lg">
                              <Label className="text-sm font-medium mb-2 block">轉錄文本：</Label>
                              <Textarea
                                value={result.txt || ""}
                                onChange={(e) => {
                                  setResult((prev) => (prev ? { ...prev, txt: e.target.value } : null))
                                }}
                                className="min-h-[300px] resize-none font-mono text-sm"
                                placeholder="轉錄文本將在這裡顯示..."
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="srt" forceMount className="data-[state=inactive]:hidden">
                            <div className="p-4 bg-muted rounded-lg">
                              <Label className="text-sm font-medium mb-2 block">SRT字幕：</Label>
                              <Textarea
                                value={result.srt || ""}
                                onChange={(e) => {
                                  setResult((prev) => (prev ? { ...prev, srt: e.target.value } : null))
                                }}
                                className="min-h-[300px] resize-none font-mono text-sm"
                                placeholder="SRT字幕將在這裡顯示..."
                              />
                            </div>
                          </TabsContent>
                        </Tabs>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => {
                              const text = activeResultTab === 'txt' ? result.txt || '' : result.srt || ''
                              copyToClipboard(text)
                            }}
                            className="flex-1"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            複製到剪貼板
                          </Button>
                          <Button
                            onClick={convertResultToTraditional}
                            variant="secondary"
                            className="flex-1"
                            disabled={isConvertingTraditional}
                          >
                        {isConvertingTraditional ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        簡轉繁
                      </Button>
                          <Button
                            onClick={() => {
                              const text = activeResultTab === 'txt' ? result.txt || '' : result.srt || ''
                              downloadFile(text, activeResultTab)
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            下載文件
                          </Button>
                          <Button
                            onClick={generateMeetingNotes}
                            variant="default"
                            className="min-w-[220px] bg-amber-500 text-stone-950 hover:bg-amber-400"
                            disabled={isPreparingMeetingNotes || !(result.txt || "").trim()}
                          >
                            {isPreparingMeetingNotes ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4 mr-2" />
                            )}
                            產生會議記錄
                          </Button>
                          <Button
                            onClick={() => setWorkspaceTab("meeting-notes")}
                            variant="secondary"
                            className="min-w-[180px]"
                            disabled={meetingNotesViewState.disabled}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            前往會議記錄
                          </Button>
                        </div>
                        {meetingNotesError ? (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{meetingNotesError}</AlertDescription>
                          </Alert>
                        ) : null}
                      </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileAudio className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">上傳音檔文件以查看轉錄結果</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    活躍任務
                  </CardTitle>
                  <CardDescription>轉錄流程中的背景任務會顯示在這裡，不再單獨占用主 tab。</CardDescription>
                </div>
                <Button onClick={fetchActiveTasks} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTasks.length > 0 ? (
                <div className="space-y-4">
                  {activeTasks.map((task) => (
                    <div key={task.task_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileAudio className="w-4 h-4" />
                          <span className="font-medium">{task.filename}</span>
                          {getStatusBadge(task.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(task.created_at).toLocaleString()}
                          </span>
                          {task.status === "running" && (
                            <Button
                              onClick={() => handleCancelTask(task.task_id)}
                              variant="outline"
                              size="sm"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>語言: {task.language ? (task.language === "auto" ? "自動檢測" : task.language) : "未指定"}</span>
                          <span>進度: {task.progress}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>降噪: {task.denoise ? "已啟用" : "未啟用"}</span>
                        </div>
                        {task.status === "running" && (
                          <Progress value={task.progress} className="w-full" />
                        )}
                      </div>
                      
                      <div className="mt-2 text-xs text-muted-foreground">
                        任務ID: {task.task_id}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">當前沒有活躍的轉錄任務</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meeting-notes" forceMount className="space-y-6 data-[state=inactive]:hidden">
          <Card className="overflow-hidden border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,237,213,0.92))] shadow-[0_20px_60px_-35px_rgba(180,83,9,0.45)]">
            <CardHeader className="border-b border-amber-200/70 bg-white/45">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-700/80">
                    Meeting Memo
                  </p>
                  <div>
                    <CardTitle className="text-2xl font-semibold tracking-tight text-stone-900">
                      會議記錄整理工作檯
                    </CardTitle>
                    <CardDescription className="mt-1 max-w-2xl text-sm leading-6 text-stone-700">
                      先保留原始逐字稿，再把可行動資訊整理成摘要、重點、決議與待辦。這一頁只做整理，不混進任務管理。
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="rounded-full border border-amber-300/80 bg-white/70 px-4 py-2 text-xs font-medium text-amber-800 shadow-sm">
                    {meetingNotesViewState.badge}
                  </div>
                  <Button variant="outline" onClick={() => setWorkspaceTab("transcribe")}>
                    回到轉錄文件
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
              {meetingNotes ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-[22px] border border-amber-200/80 bg-white/75 px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700/70">Summary</p>
                      <p className="mt-2 text-2xl font-semibold text-stone-900">{meetingNotes.summary.trim() ? "01" : "00"}</p>
                      <p className="mt-1 text-xs text-stone-600">摘要區塊已啟用</p>
                    </div>
                    <div className="rounded-[22px] border border-sky-200/80 bg-white/75 px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700/70">Discussion</p>
                      <p className="mt-2 text-2xl font-semibold text-stone-900">{meetingNotes.discussion_points.length}</p>
                      <p className="mt-1 text-xs text-stone-600">重點討論條目</p>
                    </div>
                    <div className="rounded-[22px] border border-emerald-200/80 bg-white/75 px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700/70">Decision</p>
                      <p className="mt-2 text-2xl font-semibold text-stone-900">{meetingNotes.decisions.length}</p>
                      <p className="mt-1 text-xs text-stone-600">已整理決議事項</p>
                    </div>
                    <div className="rounded-[22px] border border-violet-200/80 bg-white/75 px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-700/70">Pending</p>
                      <p className="mt-2 text-2xl font-semibold text-stone-900">{meetingNotes.pending_items.length}</p>
                      <p className="mt-1 text-xs text-stone-600">未決議事項條目</p>
                    </div>
                    <div className="rounded-[22px] border border-rose-200/80 bg-white/75 px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-700/70">Action</p>
                      <p className="mt-2 text-2xl font-semibold text-stone-900">{meetingNotes.action_items.length}</p>
                      <p className="mt-1 text-xs text-stone-600">待辦事項條目</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-stone-200/80 bg-white/70 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-stone-900">整理稿輸出</p>
                      <p className="text-xs text-stone-600">可以直接複製到文件或下載成 Markdown。</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => copyToClipboard(formatMeetingNotesForExport(meetingNotes))}>
                        <Copy className="mr-2 h-4 w-4" />
                        複製整理稿
                      </Button>
                      <Button onClick={downloadMeetingNotes} className="bg-stone-900 text-stone-50 hover:bg-stone-800">
                        <Download className="mr-2 h-4 w-4" />
                        下載 Markdown
                      </Button>
                      <Button onClick={downloadMeetingNotesDocx} className="bg-stone-900 text-stone-50 hover:bg-stone-800">
                        <Download className="mr-2 h-4 w-4" />
                        下載 DOCX
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
                    <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-700">
                        <FileText className="h-4 w-4 text-amber-600" />
                        摘要
                      </div>
                      <Textarea
                        value={meetingNotes.summary}
                        onChange={(event) => updateMeetingNotesSummary(event.target.value)}
                        className="min-h-[180px] resize-none border-amber-100 bg-white/90 text-sm leading-7 text-stone-800"
                        placeholder="整理後的摘要會顯示在這裡"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-sky-200/70 bg-sky-50/90 p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-sky-900">
                          <Sparkles className="h-4 w-4" />
                          重點討論
                        </div>
                        <Textarea
                          value={meetingNotes.discussion_points.join("\n")}
                          onChange={(event) => updateMeetingNotesList("discussion_points", event.target.value)}
                          className="min-h-[220px] resize-none border-sky-100 bg-white/80 text-sm leading-6 text-slate-800"
                        />
                      </div>

                      <div className="rounded-[24px] border border-emerald-200/70 bg-emerald-50/90 p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-900">
                          <CheckCircle className="h-4 w-4" />
                          決議事項
                        </div>
                        <Textarea
                          value={meetingNotes.decisions.join("\n")}
                          onChange={(event) => updateMeetingNotesList("decisions", event.target.value)}
                          className="min-h-[220px] resize-none border-emerald-100 bg-white/80 text-sm leading-6 text-slate-800"
                        />
                      </div>

                      <div className="rounded-[24px] border border-violet-200/70 bg-violet-50/90 p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-violet-900">
                          <AlertCircle className="h-4 w-4" />
                          未決議事項
                        </div>
                        <Textarea
                          value={meetingNotes.pending_items.join("\n")}
                          onChange={(event) => updateMeetingNotesList("pending_items", event.target.value)}
                          className="min-h-[220px] resize-none border-violet-100 bg-white/85 text-sm leading-6 text-slate-800"
                        />
                      </div>

                      <div className="rounded-[24px] border border-rose-200/70 bg-rose-50/90 p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-rose-900">
                          <Clock className="h-4 w-4" />
                          待辦事項
                        </div>
                        <Textarea
                          value={meetingNotes.action_items.join("\n")}
                          onChange={(event) => updateMeetingNotesList("action_items", event.target.value)}
                          className="min-h-[160px] resize-none border-rose-100 bg-white/85 text-sm leading-6 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-stone-200/80 bg-white/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-stone-900">原始逐字稿參考</p>
                        <p className="text-xs text-stone-600">整理會議記錄時，可以隨時對照 TXT 內容。</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setWorkspaceTab("transcribe")}>
                        查看 TXT / SRT
                      </Button>
                    </div>
                    <Textarea
                      value={result?.txt || ""}
                      readOnly
                      className="min-h-[220px] resize-none border-stone-200 bg-white/90 font-mono text-sm leading-6 text-stone-700"
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-[24px] border border-dashed border-amber-300/80 bg-white/60 px-6 py-10 text-center">
                  <Sparkles className="mx-auto mb-3 h-8 w-8 text-amber-500" />
                  <p className="text-base font-medium text-stone-800">先完成轉錄，再產生會議記錄整理稿。</p>
                  <p className="mt-2 text-sm text-stone-600">
                    逐字稿準備好後，回到「轉錄文件」點擊「產生會議記錄」，這裡就會出現可直接編修的整理稿。
                  </p>
                  <Button className="mt-5" onClick={() => setWorkspaceTab("transcribe")} variant="outline">
                    回到轉錄文件
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
