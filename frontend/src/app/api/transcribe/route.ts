import { type NextRequest, NextResponse } from "next/server"
import { ApiClient } from "@/lib/api-client"
import { isDevMockEnabled, startMockTask } from "@/lib/dev-transcribe-mock"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file") as File
  const language = formData.get("language") as string
  const denoise = formData.get("denoise") as string | null

  if (!file) {
    return NextResponse.json(
      { detail: [{ loc: ["body", "file"], msg: "File is required", type: "missing" }] },
      { status: 422 },
    )
  }

  if (isDevMockEnabled()) {
    const task = startMockTask({
      filename: file.name,
      language: language && language.trim() !== "" ? language : "auto",
      denoise: denoise === "true",
    })

    return NextResponse.json({
      task_id: task.task_id,
      status: "started",
      message: "轉錄任務已啟動",
    })
  }

  // Create FormData for the external API
  const apiFormData = new FormData()
  apiFormData.append("file", file)
  
  // Add language parameter if provided
  if (language && language.trim() !== "") {
    apiFormData.append("language", language)
  }

  // Forward denoise toggle state when provided by the client
  if (denoise !== null) {
    apiFormData.append("denoise", denoise)
  }

  return ApiClient.post("/transcribe/", apiFormData)
}
