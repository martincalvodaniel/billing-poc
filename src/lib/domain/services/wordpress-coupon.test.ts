import { describe, expect, it } from "bun:test"
import {
  buildWordPressCouponPayload,
  calculateWordPressCouponNetAmount,
  generateWordPressCouponCode,
} from "./wordpress-coupon"

describe("calculateWordPressCouponNetAmount", () => {
  it("removes 21 percent VAT from the entered amount", () => {
    expect(calculateWordPressCouponNetAmount(55)).toBe("45.4545454545455")
  })
})

describe("generateWordPressCouponCode", () => {
  it("generates an eight character alphanumeric code", () => {
    expect(generateWordPressCouponCode()).toMatch(/^[a-zA-Z0-9]{8}$/)
  })
})

describe("buildWordPressCouponPayload", () => {
  it("builds the fixed cart single-use WooCommerce payload", () => {
    expect(
      buildWordPressCouponPayload(
        {
          description: "someone@example.com",
          amount: 55,
          dateExpires: "2027-06-19",
        },
        "z9wxj988"
      )
    ).toEqual({
      code: "z9wxj988",
      description: "someone@example.com",
      discount_type: "fixed_cart",
      amount: "45.4545454545455",
      date_expires: "2027-06-19T00:00:00",
      usage_limit: 1,
      usage_limit_per_user: 1,
    })
  })
})
