import { describe, expect, test } from "bun:test"
import {
  buildPaymentsKey,
  buildPaymentsUrl,
  isPaymentsKey,
} from "./usePayments"

describe("buildPaymentsKey", () => {
  test("returns a stable tuple for the same inputs", () => {
    const a = buildPaymentsKey({ year: 2025, month: 3 })
    const b = buildPaymentsKey({ year: 2025, month: 3 })
    expect(a).toEqual(b)
    expect(a).toEqual(["/api/payments", 2025, 3])
  })

  test("uses -1 sentinel when month is omitted", () => {
    const key = buildPaymentsKey({ year: 2024 })
    expect(key).toEqual(["/api/payments", 2024, -1])
  })

  test("differentiates keys for different month values", () => {
    expect(buildPaymentsKey({ year: 2025, month: 1 })).not.toEqual(
      buildPaymentsKey({ year: 2025, month: 2 })
    )
  })
})

describe("buildPaymentsUrl", () => {
  test("includes only year when month is omitted", () => {
    expect(buildPaymentsUrl({ year: 2025 })).toBe("/api/payments?year=2025")
  })

  test("includes &month= when month is provided", () => {
    expect(buildPaymentsUrl({ year: 2025, month: 7 })).toBe(
      "/api/payments?year=2025&month=7"
    )
  })

  test("encodes year and month numerically", () => {
    expect(buildPaymentsUrl({ year: 1999, month: 12 })).toBe(
      "/api/payments?year=1999&month=12"
    )
  })

  test("treats month=0 as provided (not omitted)", () => {
    // Defensive: undefined is the only "omitted" signal.
    expect(buildPaymentsUrl({ year: 2025, month: 0 })).toBe(
      "/api/payments?year=2025&month=0"
    )
  })
})

describe("isPaymentsKey", () => {
  test("returns true for a valid payments key array", () => {
    expect(isPaymentsKey(["/api/payments", 2025, 3])).toBe(true)
    expect(isPaymentsKey(["/api/payments", 2025, -1])).toBe(true)
  })

  test("returns false for unrelated arrays", () => {
    expect(isPaymentsKey(["/api/clients", 2025, 3])).toBe(false)
    expect(isPaymentsKey([])).toBe(false)
  })

  test("returns false for non-array values", () => {
    expect(isPaymentsKey("/api/payments")).toBe(false)
    expect(isPaymentsKey(null)).toBe(false)
    expect(isPaymentsKey(undefined)).toBe(false)
    expect(isPaymentsKey({ 0: "/api/payments" })).toBe(false)
    expect(isPaymentsKey(42)).toBe(false)
  })
})
