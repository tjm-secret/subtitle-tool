import { NextRequest, NextResponse } from "next/server"

import { ApiClient } from "@/lib/api-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (typeof body?.transcript !== "string" || body.transcript.trim() === "") {
      return NextResponse.json(
        { detail: "Transcript is required" },
        { status: 422 },
      )
    }

    return ApiClient.post("/meeting-notes/", {
      transcript: body.transcript,
    })
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON payload" },
      { status: 400 },
    )
  }
}
