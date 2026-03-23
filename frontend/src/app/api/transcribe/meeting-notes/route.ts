import { type NextRequest, NextResponse } from "next/server"
import { ApiClient } from "@/lib/api-client"
import { isDevMockEnabled } from "@/lib/dev-transcribe-mock"
import { buildMeetingNotes } from "@/lib/meeting-notes"

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (!body?.transcript || !String(body.transcript).trim()) {
    return NextResponse.json(
      { detail: [{ loc: ["body", "transcript"], msg: "Transcript is required", type: "missing" }] },
      { status: 422 },
    )
  }

  if (isDevMockEnabled()) {
    return NextResponse.json(buildMeetingNotes(body.transcript))
  }

  return ApiClient.post("/transcribe/meeting-notes", body)
}
