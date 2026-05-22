import { describe, expect, it } from "bun:test"
import {
  coerceValue,
  daysValidFor,
  monthsValidFor,
} from "./partialDatePicker-utils"

describe("coerceValue", () => {
  it("returns empty when year is undefined", () => {
    expect(coerceValue({ month: 6, day: 15 })).toEqual({})
  })

  it("clears day and month when year is undefined", () => {
    expect(coerceValue({ year: undefined, month: 3, day: 10 })).toEqual({})
  })

  it("clears day when month is undefined", () => {
    expect(coerceValue({ year: 2024, day: 5 })).toEqual({ year: 2024 })
  })

  it("preserves all fields when valid", () => {
    expect(coerceValue({ year: 2024, month: 6, day: 15 })).toEqual({
      year: 2024,
      month: 6,
      day: 15,
    })
  })

  it("drops day when not valid for month", () => {
    expect(coerceValue({ year: 2023, month: 2, day: 30 })).toEqual({
      year: 2023,
      month: 2,
    })
  })

  it("keeps Feb 29 on a leap year", () => {
    expect(coerceValue({ year: 2024, month: 2, day: 29 })).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    })
  })

  it("drops Feb 29 on a non-leap year", () => {
    expect(coerceValue({ year: 2023, month: 2, day: 29 })).toEqual({
      year: 2023,
      month: 2,
    })
  })
})

describe("monthsValidFor", () => {
  it("returns 1..12 for a given year", () => {
    expect(monthsValidFor(2024)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ])
  })

  it("returns [] when year is undefined", () => {
    expect(monthsValidFor(undefined)).toEqual([])
  })
})

describe("daysValidFor", () => {
  it("returns [] when year or month is missing", () => {
    expect(daysValidFor(undefined, 6)).toEqual([])
    expect(daysValidFor(2024, undefined)).toEqual([])
    expect(daysValidFor(undefined, undefined)).toEqual([])
  })

  it("returns 1..30 for April", () => {
    const days = daysValidFor(2024, 4)
    expect(days).toHaveLength(30)
    expect(days[0]).toBe(1)
    expect(days[days.length - 1]).toBe(30)
  })

  it("returns 1..31 for January", () => {
    expect(daysValidFor(2024, 1)).toHaveLength(31)
  })

  it("includes Feb 29 on leap year 2024", () => {
    const days = daysValidFor(2024, 2)
    expect(days).toHaveLength(29)
    expect(days).toContain(29)
  })

  it("excludes Feb 29 on non-leap year 2023", () => {
    const days = daysValidFor(2023, 2)
    expect(days).toHaveLength(28)
    expect(days).not.toContain(29)
  })

  it("excludes Feb 29 on year 2100 (divisible by 100 but not 400)", () => {
    expect(daysValidFor(2100, 2)).toHaveLength(28)
  })

  it("includes Feb 29 on year 2000 (divisible by 400)", () => {
    expect(daysValidFor(2000, 2)).toHaveLength(29)
  })

  it("returns [] for out-of-range months", () => {
    expect(daysValidFor(2024, 0)).toEqual([])
    expect(daysValidFor(2024, 13)).toEqual([])
  })
})
