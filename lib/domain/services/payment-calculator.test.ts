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
