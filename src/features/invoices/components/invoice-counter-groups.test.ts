import { describe, expect, test } from "bun:test"
import {
  formatInvoiceCounter,
  groupInvoiceCountersByYear,
} from "./invoice-counter-groups"

describe("groupInvoiceCountersByYear", () => {
  test("groups counters by descending year and preserves series order", () => {
    const groups = groupInvoiceCountersByYear([
      { series: "SimpleInvoice", year: 2025, lastNumber: 12 },
      { series: "Invoice", year: 2026, lastNumber: 42 },
      { series: "RectificativeInvoice", year: 2026, lastNumber: 3 },
    ])

    expect(groups.map((group) => group.year)).toEqual([2026, 2025])
    expect(groups[0].counters.map((counter) => counter.series)).toEqual([
      "Invoice",
      "SimpleInvoice",
      "RectificativeInvoice",
      "RectificativeSimpleInvoice",
    ])
    expect(groups[0].counters.map((counter) => counter.lastNumber)).toEqual([
      42, 0, 3, 0,
    ])
  })

  test("ignores link-only receipt entries", () => {
    expect(
      groupInvoiceCountersByYear([
        { series: "Receipt", year: 2026, lastNumber: 9 },
      ])
    ).toEqual([])
  })
})

describe("formatInvoiceCounter", () => {
  test("pads invoice numbers to at least three digits", () => {
    expect(formatInvoiceCounter(0)).toBe("000")
    expect(formatInvoiceCounter(7)).toBe("007")
    expect(formatInvoiceCounter(1234)).toBe("1234")
  })
})
