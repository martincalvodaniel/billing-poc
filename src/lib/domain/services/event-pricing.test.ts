import { describe, expect, test } from "bun:test"
import { computeEventPaymentAmount, deriveEventDate } from "./event-pricing"

describe("computeEventPaymentAmount", () => {
  test("bug-report regression: pricePerSeat=10, vatRate=21, seats=1, no duration", () => {
    const r = computeEventPaymentAmount(
      { pricePerSeat: 10, vatRate: 21, durationMinutes: undefined },
      1
    )
    expect(r).toEqual({
      netAmount: 8.26,
      vatAmount: 1.74,
      total: 10,
      vatRate: 21,
    })
  })

  test("bug-report regression: pricePerSeat=10, vatRate=21, seats=1, durationMinutes=180 → total=10 (duration does NOT scale price)", () => {
    const r = computeEventPaymentAmount(
      { pricePerSeat: 10, vatRate: 21, durationMinutes: 180 },
      1
    )
    expect(r).toEqual({
      netAmount: 8.26,
      vatAmount: 1.74,
      total: 10,
      vatRate: 21,
    })
  })

  test("3 seats: total=30, net=24.79, vat=5.21", () => {
    const r = computeEventPaymentAmount(
      { pricePerSeat: 10, vatRate: 21, durationMinutes: undefined },
      3
    )
    expect(r).toEqual({
      netAmount: 24.79,
      vatAmount: 5.21,
      total: 30,
      vatRate: 21,
    })
  })

  test("vatRate=0 → net equals total, vat=0", () => {
    const r = computeEventPaymentAmount(
      { pricePerSeat: 10, vatRate: 0, durationMinutes: undefined },
      1
    )
    expect(r).toEqual({
      netAmount: 10,
      vatAmount: 0,
      total: 10,
      vatRate: 0,
    })
  })

  test("pricePerSeat=0 → all zero", () => {
    const r = computeEventPaymentAmount(
      { pricePerSeat: 0, vatRate: 21, durationMinutes: undefined },
      5
    )
    expect(r).toEqual({
      netAmount: 0,
      vatAmount: 0,
      total: 0,
      vatRate: 21,
    })
  })

  test("durationMinutes is informational and does not affect totals", () => {
    const base = { pricePerSeat: 10, vatRate: 21 }
    const r30 = computeEventPaymentAmount({ ...base, durationMinutes: 30 }, 1)
    const r60 = computeEventPaymentAmount({ ...base, durationMinutes: 60 }, 1)
    const r90 = computeEventPaymentAmount({ ...base, durationMinutes: 90 }, 1)
    const r180 = computeEventPaymentAmount({ ...base, durationMinutes: 180 }, 1)
    const rNone = computeEventPaymentAmount(
      { ...base, durationMinutes: undefined },
      1
    )
    expect(r30).toEqual(rNone)
    expect(r60).toEqual(rNone)
    expect(r90).toEqual(rNone)
    expect(r180).toEqual(rNone)
  })

  test("returned vatRate mirrors event.vatRate exactly", () => {
    const r = computeEventPaymentAmount(
      { pricePerSeat: 10, vatRate: 10, durationMinutes: 60 },
      1
    )
    expect(r.vatRate).toBe(10)
  })

  test("net + vatAmount equals total (within rounding)", () => {
    const r = computeEventPaymentAmount(
      { pricePerSeat: 33.33, vatRate: 21, durationMinutes: 75 },
      4
    )
    expect(round2(r.netAmount + r.vatAmount)).toBe(r.total)
  })

  test("rounds to 2 decimals (10.005 input)", () => {
    const r = computeEventPaymentAmount(
      { pricePerSeat: 10.005, vatRate: 21, durationMinutes: undefined },
      1
    )
    expect(r.total).toBe(10.01)
  })
})

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

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
