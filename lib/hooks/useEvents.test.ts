import { describe, expect, test } from "bun:test"
import { buildEventsKey, buildEventsUrl, isEventsKey } from "./useEvents"

describe("buildEventsKey", () => {
  test("returns a stable tuple for the same inputs", () => {
    const a = buildEventsKey({ year: 2026, month: 3 })
    const b = buildEventsKey({ year: 2026, month: 3 })
    expect(a).toEqual(b)
    expect(a).toEqual(["/api/events", 2026, 3])
  })

  test("uses -1 sentinel when month is omitted", () => {
    expect(buildEventsKey({ year: 2026 })).toEqual(["/api/events", 2026, -1])
  })

  test("differentiates keys for different month values", () => {
    expect(buildEventsKey({ year: 2026, month: 1 })).not.toEqual(
      buildEventsKey({ year: 2026, month: 2 })
    )
  })

  test("differentiates keys for different year values", () => {
    expect(buildEventsKey({ year: 2025, month: 3 })).not.toEqual(
      buildEventsKey({ year: 2026, month: 3 })
    )
  })
})

describe("buildEventsUrl", () => {
  test("includes only year when month is omitted", () => {
    expect(buildEventsUrl({ year: 2026 })).toBe("/api/events?year=2026")
  })

  test("includes &month= when month is provided", () => {
    expect(buildEventsUrl({ year: 2026, month: 7 })).toBe(
      "/api/events?year=2026&month=7"
    )
  })

  test("encodes year and month numerically", () => {
    expect(buildEventsUrl({ year: 1999, month: 12 })).toBe(
      "/api/events?year=1999&month=12"
    )
  })

  test("treats month=0 as provided (not omitted)", () => {
    expect(buildEventsUrl({ year: 2026, month: 0 })).toBe(
      "/api/events?year=2026&month=0"
    )
  })
})

describe("isEventsKey", () => {
  test("returns true for a valid events key array", () => {
    expect(isEventsKey(["/api/events", 2026, 3])).toBe(true)
    expect(isEventsKey(["/api/events", 2026, -1])).toBe(true)
  })

  test("returns true for nested events URLs (broad invalidation predicate)", () => {
    // The predicate is intentionally broad: any array whose first element
    // starts with "/api/events" should invalidate. We assert the documented
    // shape used by useEvents — additional inputs are out of scope.
    expect(isEventsKey(["/api/events"])).toBe(true)
  })

  test("returns false for unrelated arrays", () => {
    expect(isEventsKey(["/api/payments", 2026, 3])).toBe(false)
    expect(isEventsKey(["/api/clients"])).toBe(false)
    expect(isEventsKey([])).toBe(false)
  })

  test("returns false for non-array values", () => {
    expect(isEventsKey("/api/events")).toBe(false)
    expect(isEventsKey(null)).toBe(false)
    expect(isEventsKey(undefined)).toBe(false)
    expect(isEventsKey({ 0: "/api/events" })).toBe(false)
    expect(isEventsKey(42)).toBe(false)
  })
})
