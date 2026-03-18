import test from "node:test"
import assert from "node:assert/strict"

import { isDevMockEnabled } from "./dev-transcribe-mock.js"

test("isDevMockEnabled returns false when DEV_TRANSCRIBE_MOCK is disabled", () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousMockFlag = process.env.DEV_TRANSCRIBE_MOCK

  process.env.NODE_ENV = "development"
  process.env.DEV_TRANSCRIBE_MOCK = "false"

  try {
    assert.equal(isDevMockEnabled(), false)
  } finally {
    process.env.NODE_ENV = previousNodeEnv
    if (typeof previousMockFlag === "undefined") {
      delete process.env.DEV_TRANSCRIBE_MOCK
    } else {
      process.env.DEV_TRANSCRIBE_MOCK = previousMockFlag
    }
  }
})
