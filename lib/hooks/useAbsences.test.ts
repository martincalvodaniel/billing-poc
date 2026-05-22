import { describe, expect, test } from "bun:test"
import {
  buildAbsencesKey,
  buildAbsencesUrl,
  isAbsencesKey,
} from "./useAbsences"

describe("buildAbsencesKey", () => {
  test("returns a stable tuple for the same inputs", () => {
    const a = buildAbsencesKey({ year: 2025, month: 3 })
    const b = buildAbsencesKey({ year: 2025, month: 3 })
    expect(a).toEqual(b)
    expect(a).toEqual(["/api/absences", 2025, 3, ""])
  })

  test("uses -1 sentinel when month is omitted", () => {
    const key = buildAbsencesKey({ year: 2024 })
    expect(key).toEqual(["/api/absences", 2024, -1, ""])
  })

  test("uses -1 sentinel when year is omitted", () => {
    const key = buildAbsencesKey({ month: 5 })
    expect(key).toEqual(["/api/absences", -1, 5, ""])
  })

  test("uses -1 sentinels when both year and month are omitted", () => {
    expect(buildAbsencesKey({})).toEqual(["/api/absences", -1, -1, ""])
  })

  test("includes studentName slot when provided", () => {
    expect(buildAbsencesKey({ year: 2025, studentName: "Alice" })).toEqual([
      "/api/absences",
      2025,
      -1,
      "Alice",
    ])
  })

  test("differentiates keys for different studentName values", () => {
    expect(buildAbsencesKey({ year: 2025, studentName: "Alice" })).not.toEqual(
      buildAbsencesKey({ year: 2025, studentName: "Bob" })
    )
  })

  test("differentiates keys for different month values", () => {
    expect(buildAbsencesKey({ year: 2025, month: 1 })).not.toEqual(
      buildAbsencesKey({ year: 2025, month: 2 })
    )
  })
})

describe("buildAbsencesUrl", () => {
  test("includes only year when month is omitted", () => {
    expect(buildAbsencesUrl({ year: 2025 })).toBe("/api/absences?year=2025")
  })

  test("includes &month= when month is provided", () => {
    expect(buildAbsencesUrl({ year: 2025, month: 7 })).toBe(
      "/api/absences?year=2025&month=7"
    )
  })

  test("encodes year and month numerically", () => {
    expect(buildAbsencesUrl({ year: 1999, month: 12 })).toBe(
      "/api/absences?year=1999&month=12"
    )
  })

  test("treats month=0 as provided (not omitted)", () => {
    expect(buildAbsencesUrl({ year: 2025, month: 0 })).toBe(
      "/api/absences?year=2025&month=0"
    )
  })

  test("omits year when undefined", () => {
    expect(buildAbsencesUrl({ month: 7 })).toBe("/api/absences?month=7")
  })

  test("omits month when undefined", () => {
    expect(buildAbsencesUrl({ year: 2025 })).toBe("/api/absences?year=2025")
  })

  test("returns bare path when nothing is set", () => {
    expect(buildAbsencesUrl({})).toBe("/api/absences")
  })

  test("includes &studentName= when set", () => {
    expect(
      buildAbsencesUrl({ year: 2025, month: 3, studentName: "Alice" })
    ).toBe("/api/absences?year=2025&month=3&studentName=Alice")
  })

  test("URL-encodes spaces in studentName", () => {
    expect(buildAbsencesUrl({ studentName: "Ana Lopez" })).toBe(
      "/api/absences?studentName=Ana%20Lopez"
    )
  })

  test("omits studentName when undefined", () => {
    expect(buildAbsencesUrl({ year: 2025 })).toBe("/api/absences?year=2025")
  })

  test("omits studentName when empty string", () => {
    expect(buildAbsencesUrl({ year: 2025, studentName: "" })).toBe(
      "/api/absences?year=2025"
    )
  })
})

describe("isAbsencesKey", () => {
  test("returns true for a valid 4-arity absences key array", () => {
    expect(isAbsencesKey(["/api/absences", 2025, 3, ""])).toBe(true)
    expect(isAbsencesKey(["/api/absences", 2025, -1, ""])).toBe(true)
    expect(isAbsencesKey(["/api/absences", -1, -1, "Alice"])).toBe(true)
  })

  test("returns false for unrelated arrays", () => {
    expect(isAbsencesKey(["/api/payments", 2025, 3, ""])).toBe(false)
    expect(isAbsencesKey(["/api/clients", 2025, 3, ""])).toBe(false)
    expect(isAbsencesKey([])).toBe(false)
  })

  test("returns false when tuple has wrong arity", () => {
    expect(isAbsencesKey(["/api/absences"])).toBe(false)
    expect(isAbsencesKey(["/api/absences", 2025])).toBe(false)
    expect(isAbsencesKey(["/api/absences", 2025, 3])).toBe(false)
    expect(isAbsencesKey(["/api/absences", 2025, 3, "", "extra"])).toBe(false)
  })

  test("returns false when slots have wrong types", () => {
    expect(isAbsencesKey(["/api/absences", "2025", 3, ""])).toBe(false)
    expect(isAbsencesKey(["/api/absences", 2025, "3", ""])).toBe(false)
    expect(isAbsencesKey(["/api/absences", null, 3, ""])).toBe(false)
    expect(isAbsencesKey(["/api/absences", 2025, undefined, ""])).toBe(false)
    expect(isAbsencesKey(["/api/absences", 2025, 3, 0])).toBe(false)
    expect(isAbsencesKey(["/api/absences", 2025, 3, undefined])).toBe(false)
  })

  test("returns false for non-array values", () => {
    expect(isAbsencesKey("/api/absences")).toBe(false)
    expect(isAbsencesKey(null)).toBe(false)
    expect(isAbsencesKey(undefined)).toBe(false)
    expect(isAbsencesKey({ 0: "/api/absences" })).toBe(false)
    expect(isAbsencesKey(42)).toBe(false)
  })
})
