import { NextResponse } from "next/server"

import { ApiClient } from "@/lib/api-client"
import { isDevMockEnabled, listMockTasks } from "@/lib/dev-transcribe-mock"

export async function GET() {
  if (isDevMockEnabled()) {
    return NextResponse.json({ active_tasks: listMockTasks() })
  }

  return ApiClient.get("/transcribe/tasks")
}
