import { describe, expect, it } from "bun:test"
import {
  calculateNetAmount,
  calculateSurchargeAmount,
  calculateTotal,
  calculateVatAmount,
  validateConcepts,
  validateDiscount,
  validateSurcharge,
  validateVat,
} from "./paymentUtils"

describe("calculateTotal", () => {
  it("returns 0 for empty concepts", () => {
    expect(calculateTotal([])).toBe(0)
  })

  it("calculates total from a single concept", () => {
    expect(calculateTotal([{ name: "Item", amount: 100, quantity: 1 }])).toBe(
      100
    )
  })

  it("multiplies amount by quantity", () => {
    expect(calculateTotal([{ name: "Item", amount: 50, quantity: 3 }])).toBe(
      150
    )
  })

  it("sums multiple concepts", () => {
    const concepts = [
      { name: "A", amount: 100, quantity: 2 },
      { name: "B", amount: 50, quantity: 1 },
    ]
    expect(calculateTotal(concepts)).toBe(250)
  })

  it("handles zero amounts", () => {
    expect(calculateTotal([{ name: "Free", amount: 0, quantity: 5 }])).toBe(0)
  })

  it("handles decimal amounts", () => {
    const result = calculateTotal([
      { name: "Item", amount: 33.33, quantity: 3 },
    ])
    expect(result).toBeCloseTo(99.99, 2)
  })

  it("defaults quantity to 1 when not provided", () => {
    // In the function, it uses `c.quantity || 1`
    expect(calculateTotal([{ name: "Item", amount: 100, quantity: 0 }])).toBe(
      100
    )
  })
})

describe("calculateVatAmount", () => {
  it("returns 0 when VAT percentage is 0", () => {
    expect(calculateVatAmount(100, 0)).toBe(0)
  })

  it("calculates VAT for standard 21%", () => {
    // Formula: total * (vat/100) / (1 + vat/100)
    // 121 * 0.21 / 1.21 = 21
    expect(calculateVatAmount(121, 21)).toBe(21)
  })

  it("keeps VAT extraction based on VAT-inclusive base even with surcharge", () => {
    // base=121, vat=21%, surcharge=5.2%
    // VAT = 121 - (121 / 1.21) = 21
    const result = calculateVatAmount(121, 21, 5.2)
    expect(result).toBe(21)
  })

  it("returns 0 for zero total", () => {
    expect(calculateVatAmount(0, 21)).toBe(0)
  })
})

describe("calculateSurchargeAmount", () => {
  it("returns 0 when surcharge percentage is 0", () => {
    expect(calculateSurchargeAmount(121, 21, 0)).toBe(0)
  })

  it("returns 0 when surcharge is not provided", () => {
    expect(calculateSurchargeAmount(121, 21)).toBe(0)
  })

  it("calculates surcharge correctly", () => {
    // base=121, vat=21%, surcharge=5.2%
    // net = 121 / 1.21 = 100, surcharge = 100 * 5.2% = 5.2
    const result = calculateSurchargeAmount(121, 21, 5.2)
    expect(result).toBe(5.2)
  })
})

describe("calculateNetAmount", () => {
  it("returns total when VAT is 0", () => {
    expect(calculateNetAmount(100, 0)).toBe(100)
  })

  it("calculates net amount for 21% VAT", () => {
    // 121 / (1 + 0.21) = 100
    expect(calculateNetAmount(121, 21)).toBe(100)
  })

  it("calculates net with VAT and surcharge", () => {
    // surcharge does not affect net extraction from VAT-inclusive base
    const result = calculateNetAmount(121, 21, 5.2)
    expect(result).toBe(100)
  })

  it("returns number with 2 decimal precision", () => {
    const result = calculateNetAmount(100, 10)
    // Should be a number with at most 2 decimal places
    expect(typeof result).toBe("number")
    expect(Number(result.toFixed(2))).toBe(result)
  })
})

describe("validateConcepts", () => {
  it("rejects empty array", () => {
    const result = validateConcepts([])
    expect(result.isValid).toBe(false)
    expect(result.error).toContain("amount greater than 0")
  })

  it("rejects all-zero amounts", () => {
    const result = validateConcepts([{ name: "A", amount: 0, quantity: 1 }])
    expect(result.isValid).toBe(false)
  })

  it("rejects concepts with empty names", () => {
    const result = validateConcepts([{ name: "", amount: 100, quantity: 1 }])
    expect(result.isValid).toBe(false)
    expect(result.error).toContain("name")
  })

  it("rejects concepts with whitespace-only names", () => {
    const result = validateConcepts([{ name: "   ", amount: 100, quantity: 1 }])
    expect(result.isValid).toBe(false)
  })

  it("accepts valid concepts", () => {
    const result = validateConcepts([
      { name: "Service A", amount: 100, quantity: 1 },
      { name: "Service B", amount: 50, quantity: 2 },
    ])
    expect(result.isValid).toBe(true)
    expect(result.error).toBeNull()
  })

  it("accepts if at least one concept has amount > 0", () => {
    const result = validateConcepts([
      { name: "Free", amount: 0, quantity: 1 },
      { name: "Paid", amount: 50, quantity: 1 },
    ])
    // Still invalid because "Free" has amount 0 but has a name, however
    // the validator only checks that at least one has amount > 0 AND all have names
    expect(result.isValid).toBe(true)
  })
})

describe("validateVat", () => {
  it("accepts 0%", () => {
    expect(validateVat("0").isValid).toBe(true)
  })

  it("accepts 21%", () => {
    expect(validateVat("21").isValid).toBe(true)
  })

  it("accepts 100%", () => {
    expect(validateVat("100").isValid).toBe(true)
  })

  it("rejects negative", () => {
    expect(validateVat("-1").isValid).toBe(false)
  })

  it("rejects over 100", () => {
    expect(validateVat("101").isValid).toBe(false)
  })

  it("rejects non-numeric", () => {
    expect(validateVat("abc").isValid).toBe(false)
  })

  it("rejects empty string", () => {
    expect(validateVat("").isValid).toBe(false)
  })
})

describe("validateSurcharge", () => {
  it("accepts empty string", () => {
    expect(validateSurcharge("").isValid).toBe(true)
  })

  it("accepts undefined", () => {
    expect(validateSurcharge(undefined).isValid).toBe(true)
  })

  it("accepts valid values", () => {
    expect(validateSurcharge("5.2").isValid).toBe(true)
  })

  it("accepts negative values for withholding", () => {
    expect(validateSurcharge("-15").isValid).toBe(true)
  })

  it("rejects values below -100", () => {
    expect(validateSurcharge("-101").isValid).toBe(false)
  })

  it("rejects over 100", () => {
    expect(validateSurcharge("101").isValid).toBe(false)
  })

  it("rejects non-numeric", () => {
    expect(validateSurcharge("abc").isValid).toBe(false)
  })
})

describe("validateDiscount", () => {
  it("accepts empty string", () => {
    expect(validateDiscount("", 100).isValid).toBe(true)
  })

  it("accepts undefined", () => {
    expect(validateDiscount(undefined, 100).isValid).toBe(true)
  })

  it("accepts whitespace-only", () => {
    expect(validateDiscount("   ", 100).isValid).toBe(true)
  })

  it("accepts zero", () => {
    expect(validateDiscount("0", 100).isValid).toBe(true)
  })

  it("accepts a value below the concepts total", () => {
    expect(validateDiscount("10", 100).isValid).toBe(true)
  })

  it("accepts a value equal to the concepts total", () => {
    expect(validateDiscount("100", 100).isValid).toBe(true)
  })

  it("rejects negative values", () => {
    const result = validateDiscount("-1", 100)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain("non-negative")
  })

  it("rejects non-numeric values", () => {
    const result = validateDiscount("abc", 100)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain("non-negative")
  })

  it("rejects values greater than the concepts total", () => {
    const result = validateDiscount("150", 100)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain("exceed")
  })
})
