import { describe, expect, test } from "bun:test"
import { getCouponPdfDisplayExpiryDate } from "./coupon-pdf-utils"

describe("getCouponPdfDisplayExpiryDate", () => {
  test("shows the previous day because coupons expire at midnight", () => {
    expect(getCouponPdfDisplayExpiryDate("2027-06-19")).toBe("2027-06-18")
  })

  test("handles month and year boundaries", () => {
    expect(getCouponPdfDisplayExpiryDate("2027-03-01")).toBe("2027-02-28")
    expect(getCouponPdfDisplayExpiryDate("2027-01-01")).toBe("2026-12-31")
  })
})
