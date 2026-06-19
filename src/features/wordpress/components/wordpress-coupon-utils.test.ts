import { describe, expect, test } from "bun:test"
import {
  buildWordpressCouponPdfUrl,
  formatCouponFinalAmount,
  getCouponLocalExpiryDate,
} from "./wordpress-coupon-utils"

describe("formatCouponFinalAmount", () => {
  test("adds 21 percent tax to the WooCommerce net amount", () => {
    expect(formatCouponFinalAmount("45.4545454545455")).toBe("55,00 €")
  })
})

describe("getCouponLocalExpiryDate", () => {
  test("returns a browser-local ISO date", () => {
    const expected = new Date("2027-06-18T22:00:00Z")
    const year = expected.getFullYear()
    const month = String(expected.getMonth() + 1).padStart(2, "0")
    const day = String(expected.getDate()).padStart(2, "0")

    expect(getCouponLocalExpiryDate("2027-06-18T22:00:00")).toBe(
      `${year}-${month}-${day}`
    )
  })
})

describe("buildWordpressCouponPdfUrl", () => {
  test("builds the inline gift-card PDF URL", () => {
    expect(buildWordpressCouponPdfUrl(4684, "2027-06-19")).toBe(
      "/api/wordpress/coupons/4684/pdf?expires=2027-06-19"
    )
  })
})
