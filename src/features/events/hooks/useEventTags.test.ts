"use client"

import { describe, expect, test } from "bun:test"
import {
  buildEventTagsKey,
  buildEventTagsUrl,
  isEventTagsKey,
} from "./useEventTags"

describe("buildEventTagsKey", () => {
  test("returns a stable tuple for income tags", () => {
    expect(buildEventTagsKey()).toEqual(["/api/tags", "income"])
  })
})

describe("buildEventTagsUrl", () => {
  test("builds the existing income tags endpoint URL", () => {
    expect(buildEventTagsUrl()).toBe("/api/tags?type=income")
  })
})

describe("isEventTagsKey", () => {
  test("returns true for the income tags key", () => {
    expect(isEventTagsKey(["/api/tags", "income"])).toBe(true)
  })

  test("returns false for other tag keys", () => {
    expect(isEventTagsKey(["/api/tags", "outcome"])).toBe(false)
    expect(isEventTagsKey(["/api/tags", "events"])).toBe(false)
  })

  test("returns false for invalid keys", () => {
    expect(isEventTagsKey(["/api/tags"])).toBe(false)
    expect(isEventTagsKey(["/api/events", "income"])).toBe(false)
    expect(isEventTagsKey("/api/tags?type=income")).toBe(false)
    expect(isEventTagsKey(null)).toBe(false)
  })
})
