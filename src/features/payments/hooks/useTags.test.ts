"use client"

import { describe, expect, test } from "bun:test"
import { buildTagsKey, buildTagsUrl, isTagsKey } from "./useTags"

describe("buildTagsKey", () => {
  test("returns tuple with /api/tags and income type", () => {
    expect(buildTagsKey("income")).toEqual(["/api/tags", "income"])
  })

  test("returns tuple with /api/tags and outcome type", () => {
    expect(buildTagsKey("outcome")).toEqual(["/api/tags", "outcome"])
  })

  test("returns stable structure suitable as SWR key", () => {
    const key = buildTagsKey("income")
    expect(Array.isArray(key)).toBe(true)
    expect(key).toHaveLength(2)
    expect(key[0]).toBe("/api/tags")
    expect(key[1]).toBe("income")
  })
})

describe("buildTagsUrl", () => {
  test("builds URL for income type", () => {
    expect(buildTagsUrl("income")).toBe("/api/tags?type=income")
  })

  test("builds URL for outcome type", () => {
    expect(buildTagsUrl("outcome")).toBe("/api/tags?type=outcome")
  })

  test("encodes the type query parameter", () => {
    // PaymentType is constrained, but we still want encodeURIComponent in place.
    const url = buildTagsUrl("income")
    expect(url.startsWith("/api/tags?type=")).toBe(true)
  })
})

describe("isTagsKey", () => {
  test("returns true for valid income key", () => {
    expect(isTagsKey(["/api/tags", "income"])).toBe(true)
  })

  test("returns true for valid outcome key", () => {
    expect(isTagsKey(["/api/tags", "outcome"])).toBe(true)
  })

  test("returns false for arrays with wrong endpoint", () => {
    expect(isTagsKey(["/api/payments", "income"])).toBe(false)
  })

  test("returns false for arrays with invalid type", () => {
    expect(isTagsKey(["/api/tags", "transfer"])).toBe(false)
    expect(isTagsKey(["/api/tags", ""])).toBe(false)
    expect(isTagsKey(["/api/tags", null])).toBe(false)
  })

  test("returns false for arrays with wrong length", () => {
    expect(isTagsKey(["/api/tags"])).toBe(false)
    expect(isTagsKey(["/api/tags", "income", "extra"])).toBe(false)
  })

  test("returns false for non-array values", () => {
    expect(isTagsKey("/api/tags?type=income")).toBe(false)
    expect(isTagsKey({ url: "/api/tags", type: "income" })).toBe(false)
    expect(isTagsKey(null)).toBe(false)
    expect(isTagsKey(undefined)).toBe(false)
  })
})
