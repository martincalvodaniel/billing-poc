import { describe, expect, test } from "bun:test"
import { computeEventPaymentAmount, deriveEventDate } from "./event-pricing"

describe("computeEventPaymentAmount", () => {
  test("multiplier 1 when duration is absent", () => {
    const r = computeEventPaymentAmount(
      { netAmount: 10, vatAmount: 2, durationMinutes: undefined },
      1
    )
    expect(r).toEqual({ netAmount: 10, vatAmount: 2, total: 12 })
  })

  test("multiplier 1 for 60 minutes", () => {
    const r = computeEventPaymentAmount(
      { netAmount: 10, vatAmount: 2, durationMinutes: 60 },
      1
    )
    expect(r).toEqual({ netAmount: 10, vatAmount: 2, total: 12 })
  })

  test("multiplier 0.5 for 30 minutes", () => {
    const r = computeEventPaymentAmount(
      { netAmount: 10, vatAmount: 2, durationMinutes: 30 },
      1
    )
    expect(r).toEqual({ netAmount: 5, vatAmount: 1, total: 6 })
  })

  test("multiplier 1.5 for 90 minutes", () => {
    const r = computeEventPaymentAmount(
      { netAmount: 10, vatAmount: 2, durationMinutes: 90 },
      1
    )
    expect(r).toEqual({ netAmount: 15, vatAmount: 3, total: 18 })
  })

  test("scales with seats (3 seats, 60 min)", () => {
    const r = computeEventPaymentAmount(
      { netAmount: 10, vatAmount: 2, durationMinutes: 60 },
      3
    )
    expect(r).toEqual({ netAmount: 30, vatAmount: 6, total: 36 })
  })

  test("scales with seats and 90 min duration", () => {
    const r = computeEventPaymentAmount(
      { netAmount: 10, vatAmount: 2, durationMinutes: 90 },
      3
    )
    expect(r).toEqual({ netAmount: 45, vatAmount: 9, total: 54 })
  })

  test("net 0 → only vat contributes to total", () => {
    const r = computeEventPaymentAmount(
      { netAmount: 0, vatAmount: 5, durationMinutes: 60 },
      2
    )
    expect(r).toEqual({ netAmount: 0, vatAmount: 10, total: 10 })
  })

  test("vat 0 → only net contributes to total", () => {
    const r = computeEventPaymentAmount(
      { netAmount: 7, vatAmount: 0, durationMinutes: 60 },
      2
    )
    expect(r).toEqual({ netAmount: 14, vatAmount: 0, total: 14 })
  })

  test("both 0 → zero totals", () => {
    const r = computeEventPaymentAmount(
      { netAmount: 0, vatAmount: 0, durationMinutes: 60 },
      5
    )
    expect(r).toEqual({ netAmount: 0, vatAmount: 0, total: 0 })
  })

  test("rounds to 2 decimals (10.005 → 10.01)", () => {
    const r = computeEventPaymentAmount(
      { netAmount: 10.005, vatAmount: 0, durationMinutes: 60 },
      1
    )
    expect(r.netAmount).toBe(10.01)
  })

  test("duration 0 falls back to multiplier 1", () => {
    const r = computeEventPaymentAmount(
      { netAmount: 10, vatAmount: 2, durationMinutes: 0 },
      1
    )
    expect(r).toEqual({ netAmount: 10, vatAmount: 2, total: 12 })
  })

  test("inversion guard: net 50 / 120 min / 1 seat → 100 (not 25)", () => {
    // Pins the convention that stored amount is per-seat FLAT and that
    // duration scales the Payment UP (>1h ⇒ multiplier > 1), not DOWN.
    const r = computeEventPaymentAmount(
      { netAmount: 50, vatAmount: 0, durationMinutes: 120 },
      1
    )
    expect(r).toEqual({ netAmount: 100, vatAmount: 0, total: 100 })
  })
})

describe("deriveEventDate", () => {
  test("returns ISO YYYY-MM-DD for valid date", () => {
    expect(deriveEventDate(2026, 5, 14)).toBe("2026-05-14")
  })

  test("pads month and day with zeros", () => {
    expect(deriveEventDate(2026, 1, 9)).toBe("2026-01-09")
  })

  test("returns undefined for invalid Feb 30", () => {
    expect(deriveEventDate(2026, 2, 30)).toBeUndefined()
  })

  test("returns undefined for invalid Apr 31", () => {
    expect(deriveEventDate(2026, 4, 31)).toBeUndefined()
  })

  test("returns undefined when day is missing", () => {
    expect(deriveEventDate(2026, 5, undefined)).toBeUndefined()
  })

  test("returns undefined when month is missing", () => {
    expect(deriveEventDate(2026, undefined, 14)).toBeUndefined()
  })

  test("returns undefined when year is missing", () => {
    expect(deriveEventDate(undefined, 5, 14)).toBeUndefined()
  })

  test("accepts Feb 29 on leap year", () => {
    expect(deriveEventDate(2024, 2, 29)).toBe("2024-02-29")
  })

  test("rejects Feb 29 on non-leap year", () => {
    expect(deriveEventDate(2025, 2, 29)).toBeUndefined()
  })
})
