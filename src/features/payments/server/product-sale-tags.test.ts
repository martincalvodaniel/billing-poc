import { describe, expect, test } from "bun:test"
import { isProductSaleTag } from "./product-sale-tags"

describe("isProductSaleTag", () => {
  test("recognizes every product payment tag", () => {
    expect(isProductSaleTag("LocalSale")).toBe(true)
    expect(isProductSaleTag("MarketSale")).toBe(true)
    expect(isProductSaleTag("Cocción")).toBe(true)
  })

  test("rejects unrelated and missing tags", () => {
    expect(isProductSaleTag("Other")).toBe(false)
    expect(isProductSaleTag(undefined)).toBe(false)
  })
})
