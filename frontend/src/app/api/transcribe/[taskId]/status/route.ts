import { type NextRequest, NextResponse } from "next/server"
import { ApiClient } from "@/lib/api-client"
import { getMockTask, isDevMockEnabled } from "@/lib/dev-transcribe-mock"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params

  if (isDevMockEnabled()) {
    const task = getMockTask(taskId)

    if (!task) {
      return NextResponse.json({ detail: "任務不存在" }, { status: 404 })
    }

    return NextResponse.json({
      task_id: task.task_id,
      status: task.status,
      progress: task.progress,
      filename: task.filename,
      created_at: task.created_at,
    })
  }

  return ApiClient.get(`/transcribe/${taskId}/status`)
}
