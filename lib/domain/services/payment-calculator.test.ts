import { describe, expect, it } from "bun:test"
import {
  calculateNetAmount,
  calculateSurchargeAmount,
  calculateTotal,
  calculateVatAmount,
  computePaymentFinancials,
} from "./payment-calculator"

describe("calculateTotal", () => {
  it("returns 0 for empty concepts", () => {
    expect(calculateTotal([])).toBe(0)
  })

  it("calculates single concept", () => {
    expect(calculateTotal([{ name: "A", amount: 100, quantity: 1 }])).toBe(100)
  })

  it("multiplies amount by quantity", () => {
    expect(calculateTotal([{ name: "A", amount: 50, quantity: 3 }])).toBe(150)
  })

  it("sums multiple concepts", () => {
    expect(
      calculateTotal([
        { name: "A", amount: 100, quantity: 1 },
        { name: "B", amount: 200, quantity: 2 },
      ])
    ).toBe(500)
  })

  it("defaults quantity to 1 when missing", () => {
    expect(calculateTotal([{ name: "A", amount: 75 }])).toBe(75)
  })
})

describe("calculateVatAmount", () => {
  it("returns 0 when vat is 0", () => {
    expect(calculateVatAmount(100, 0)).toBe(0)
  })

  it("calculates VAT from total (21%)", () => {
    expect(calculateVatAmount(121, 21)).toBe(21)
  })

  it("handles surcharge in denominator", () => {
    const result = calculateVatAmount(126.2, 21, 5.2)
    expect(result).toBeCloseTo(21, 0)
  })
})

describe("calculateSurchargeAmount", () => {
  it("returns 0 when surcharge is 0", () => {
    expect(calculateSurchargeAmount(121, 21, 0)).toBe(0)
  })

  it("calculates surcharge correctly", () => {
    const result = calculateSurchargeAmount(126.2, 21, 5.2)
    expect(result).toBeCloseTo(5.2, 0)
  })
})

describe("calculateNetAmount", () => {
  it("returns total when vat is 0", () => {
    expect(calculateNetAmount(100, 0)).toBe(100)
  })

  it("extracts net from total with 21% VAT", () => {
    expect(calculateNetAmount(121, 21)).toBe(100)
  })

  it("returns a number not a string", () => {
    expect(typeof calculateNetAmount(100, 21)).toBe("number")
  })
})

describe("computePaymentFinancials", () => {
  it("computes all financial values in one call", () => {
    const result = computePaymentFinancials(
      [{ name: "Service", amount: 121, quantity: 1 }],
      21
    )
    expect(result.total).toBe(121)
    expect(result.netAmount).toBe(100)
    expect(result.vatAmount).toBe(21)
    expect(result.surchargeAmount).toBeUndefined()
  })

  it("includes surchargeAmount when surcharge > 0", () => {
    const result = computePaymentFinancials(
      [{ name: "Service", amount: 126.2, quantity: 1 }],
      21,
      5.2
    )
    expect(result.total).toBe(126.2)
    expect(result.surchargeAmount).toBeDefined()
    expect(result.surchargeAmount).toBeCloseTo(5.2, 0)
  })
})

describe("discount scenarios", () => {
  it("discount = 0 equals no-discount baseline", () => {
    const concepts = [{ name: "Service", amount: 121, quantity: 1 }]
    const baseline = computePaymentFinancials(concepts, 21)
    const withZero = computePaymentFinancials(concepts, 21, 0, 0)
    expect(withZero.total).toBe(baseline.total)
    expect(withZero.netAmount).toBe(baseline.netAmount)
    expect(withZero.vatAmount).toBe(baseline.vatAmount)
    expect(withZero.surchargeAmount).toBe(baseline.surchargeAmount)
  })

  it("discount = 10 on concepts = 100, vat = 21 yields effectiveTotal 90 and recomputed net/vat", () => {
    const result = computePaymentFinancials(
      [{ name: "Service", amount: 100, quantity: 1 }],
      21,
      0,
      10
    )
    expect(result.total).toBe(90)
    expect(result.netAmount).toBeCloseTo(74.38, 2)
    expect(result.vatAmount).toBeCloseTo(15.62, 2)
    expect(result.surchargeAmount).toBeUndefined()
  })

  it("discount equal to concepts total yields total 0", () => {
    const result = computePaymentFinancials(
      [{ name: "Service", amount: 100, quantity: 1 }],
      21,
      0,
      100
    )
    expect(result.total).toBe(0)
    expect(result.netAmount).toBe(0)
    expect(result.vatAmount).toBe(0)
  })

  it("discount applies before VAT and surcharge extraction", () => {
    const result = computePaymentFinancials(
      [{ name: "Service", amount: 126.2, quantity: 1 }],
      21,
      5.2,
      26.2
    )
    expect(result.total).toBe(100)
    expect(result.netAmount).toBeCloseTo(79.24, 2)
    expect(result.vatAmount).toBeCloseTo(16.64, 2)
    expect(result.surchargeAmount).toBeCloseTo(4.12, 2)
  })

  it("regression: 40 discount applied then cleared restores baseline (no oscillation)", () => {
    // Scenario from the 260522-2340 fixes iteration: a payment with
    // concepts = [100] and vat = 21 is edited to add a 40 discount, then
    // edited again to remove the discount. The recompute on the second
    // edit must use 0 (not the previously stored 40) so the displayed
    // total returns to 100 rather than drifting (e.g. 39.93).
    const concepts = [{ name: "Service", amount: 100, quantity: 1 }]

    const applied = computePaymentFinancials(concepts, 21, 0, 40)
    expect(applied.total).toBe(60)
    expect(applied.netAmount).toBeCloseTo(49.59, 2)
    expect(applied.vatAmount).toBeCloseTo(10.41, 2)

    const cleared = computePaymentFinancials(concepts, 21, 0, 0)
    expect(cleared.total).toBe(100)
    expect(cleared.netAmount).toBeCloseTo(82.64, 2)
    expect(cleared.vatAmount).toBeCloseTo(17.36, 2)

    const baseline = computePaymentFinancials(concepts, 21)
    expect(cleared.total).toBe(baseline.total)
    expect(cleared.netAmount).toBe(baseline.netAmount)
    expect(cleared.vatAmount).toBe(baseline.vatAmount)
  })
})
