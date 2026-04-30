import { describe, expect, test } from "bun:test"
import {
  buildAbsenceSummaryKey,
  buildAbsenceSummaryUrl,
  isAbsenceSummaryKey,
} from "./useAbsenceSummary"

describe("buildAbsenceSummaryKey", () => {
  test("returns tuple with /api/absences/summary", () => {
    expect(buildAbsenceSummaryKey()).toEqual(["/api/absences/summary"])
  })

  test("returns stable structure suitable as SWR key", () => {
    const key = buildAbsenceSummaryKey()
    expect(Array.isArray(key)).toBe(true)
    expect(key).toHaveLength(1)
    expect(key[0]).toBe("/api/absences/summary")
  })
})

describe("buildAbsenceSummaryUrl", () => {
  test("returns the summary endpoint", () => {
    expect(buildAbsenceSummaryUrl()).toBe("/api/absences/summary")
  })
})

describe("isAbsenceSummaryKey", () => {
  test("returns true for the valid key", () => {
    expect(isAbsenceSummaryKey(["/api/absences/summary"])).toBe(true)
  })

  test("returns true for the freshly built key", () => {
    expect(isAbsenceSummaryKey(buildAbsenceSummaryKey())).toBe(true)
  })

  test("returns false for arrays with wrong endpoint", () => {
    expect(isAbsenceSummaryKey(["/api/absences"])).toBe(false)
    expect(isAbsenceSummaryKey(["/api/tags"])).toBe(false)
    expect(isAbsenceSummaryKey(["/api/absences/summary/extra"])).toBe(false)
  })

  test("returns false for arrays with wrong length", () => {
    expect(isAbsenceSummaryKey([])).toBe(false)
    expect(isAbsenceSummaryKey(["/api/absences/summary", "extra"])).toBe(false)
  })

  test("returns false for non-array values", () => {
    expect(isAbsenceSummaryKey("/api/absences/summary")).toBe(false)
    expect(isAbsenceSummaryKey({ url: "/api/absences/summary" })).toBe(false)
    expect(isAbsenceSummaryKey(null)).toBe(false)
    expect(isAbsenceSummaryKey(undefined)).toBe(false)
  })
})
