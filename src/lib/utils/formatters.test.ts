import { describe, expect, it } from "bun:test"
import { formatCurrency, formatDate, formatMonthYear } from "./formatters"

describe("formatCurrency", () => {
  it("formats in EUR with es-ES locale", () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain("1234,56")
    expect(result).toContain("€")
  })

  it("formats zero", () => {
    const result = formatCurrency(0)
    expect(result).toContain("0")
  })

  it("formats negative amounts", () => {
    const result = formatCurrency(-500)
    expect(result).toContain("500")
  })
})

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2024-03-15")
    expect(result).toContain("Mar")
    expect(result).toContain("15")
    expect(result).toContain("2024")
  })
})

describe("formatMonthYear", () => {
  it("formats date to month and year", () => {
    const result = formatMonthYear(new Date(2024, 2, 1)) // March 2024
    expect(result).toContain("March")
    expect(result).toContain("2024")
  })
})
