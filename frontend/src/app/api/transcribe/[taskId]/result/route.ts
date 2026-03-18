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

    if (task.status !== "completed") {
      return NextResponse.json({ detail: "任務仍在進行中" }, { status: 202 })
    }

    return NextResponse.json(task.result)
  }

  return ApiClient.get(`/transcribe/${taskId}/result`)
}
