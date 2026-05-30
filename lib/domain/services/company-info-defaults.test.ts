import { describe, expect, test } from "bun:test"
import { DEFAULT_COMPANY_INFO, withDefaults } from "./company-info-defaults"

describe("withDefaults", () => {
  test("null returns defaults", () => {
    expect(withDefaults(null)).toEqual(DEFAULT_COMPANY_INFO)
  })

  test("empty object returns defaults", () => {
    expect(withDefaults({})).toEqual(DEFAULT_COMPANY_INFO)
  })

  test("overrides only the provided fields", () => {
    const result = withDefaults({ name: "Acme" })
    expect(result.name).toBe("Acme")
    expect(result.taxId).toBe(DEFAULT_COMPANY_INFO.taxId)
    expect(result.email).toBe(DEFAULT_COMPANY_INFO.email)
  })

  test("empty string is treated as missing", () => {
    const result = withDefaults({ name: "" })
    expect(result.name).toBe(DEFAULT_COMPANY_INFO.name)
  })

  test("sets logoUrl when provided", () => {
    const result = withDefaults({ logoUrl: "https://x/y.png" })
    expect(result.logoUrl).toBe("https://x/y.png")
  })
})
