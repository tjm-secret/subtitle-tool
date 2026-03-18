import { type NextRequest, NextResponse } from "next/server"
import { ApiClient } from "@/lib/api-client"
import { cancelMockTask, isDevMockEnabled } from "@/lib/dev-transcribe-mock"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params

  if (isDevMockEnabled()) {
    const task = cancelMockTask(taskId)

    if (!task) {
      return NextResponse.json({ detail: "任務不存在或已完成" }, { status: 404 })
    }

    return NextResponse.json({
      task_id: task.task_id,
      status: "cancelled",
      message: "任務已被強制終止",
    })
  }

  return ApiClient.post(`/transcribe/${taskId}/cancel`)
}
