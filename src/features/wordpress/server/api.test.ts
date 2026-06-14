import { describe, expect, it } from "bun:test"
import {
  buildWordPressOrderStatusPayload,
  buildWordPressOrdersUrl,
  buildWordPressOrderUrl,
  sanitizeWordPressBilling,
  sanitizeWordPressPhone,
  toCapitalCase,
} from "@/features/wordpress/server/api"

describe("buildWordPressOrdersUrl", () => {
  it("builds the WooCommerce orders page URL", () => {
    expect(buildWordPressOrdersUrl("https://example.com/wp-json/", 3)).toBe(
      "https://example.com/wp-json/wc/v3/orders?page=3"
    )
  })
})

describe("buildWordPressOrderUrl", () => {
  it("builds the WooCommerce single order URL", () => {
    expect(buildWordPressOrderUrl("https://example.com/wp-json/", 123)).toBe(
      "https://example.com/wp-json/wc/v3/orders/123"
    )
  })
})

describe("buildWordPressOrderStatusPayload", () => {
  it("builds the selected status payload", () => {
    expect(buildWordPressOrderStatusPayload("cancelled")).toEqual({
      status: "cancelled",
    })
  })
})

describe("toCapitalCase", () => {
  it("normalizes names to capital case", () => {
    expect(toCapitalCase("  jUaN  ")).toBe("Juan")
    expect(toCapitalCase("mARIA del MAR")).toBe("Maria Del Mar")
  })
})

describe("sanitizeWordPressPhone", () => {
  it("removes a +34 prefix and spaces between numbers", () => {
    expect(sanitizeWordPressPhone("+34 600 000 000")).toBe("600000000")
    expect(sanitizeWordPressPhone("+34600 000 000")).toBe("600000000")
  })

  it("removes spaces between numbers without requiring a +34 prefix", () => {
    expect(sanitizeWordPressPhone("  600 000 000  ")).toBe("600000000")
  })
})

describe("sanitizeWordPressBilling", () => {
  it("sanitizes names and phone while preserving other billing fields", () => {
    expect(
      sanitizeWordPressBilling({
        first_name: " aNA ",
        last_name: "garCIA loPEZ",
        address_1: "Street 1",
        address_2: "",
        city: "Madrid",
        postcode: "28001",
        country: "ES",
        email: "ana@example.com",
        phone: "+34 611 222 333",
      })
    ).toEqual({
      first_name: "Ana",
      last_name: "Garcia Lopez",
      address_1: "Street 1",
      address_2: "",
      city: "Madrid",
      postcode: "28001",
      country: "ES",
      email: "ana@example.com",
      phone: "611222333",
    })
  })
})
