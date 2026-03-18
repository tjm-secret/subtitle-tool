import { NextRequest, NextResponse } from "next/server"

import { ApiClient } from "@/lib/api-client"
import { convertTraditionalFallback, isDevMockEnabled } from "@/lib/dev-transcribe-mock"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (typeof body?.txt === "undefined" && typeof body?.srt === "undefined") {
      return NextResponse.json(
        { detail: "No text provided for conversion" },
        { status: 400 },
      )
    }

    if (isDevMockEnabled()) {
      return NextResponse.json(convertTraditionalFallback(body))
    }

    return ApiClient.post("/transcribe/convert-traditional", body)
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON payload" },
      { status: 400 },
    )
  }
}
