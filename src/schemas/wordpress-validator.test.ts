import { describe, expect, it } from "bun:test"
import { createWordpressCouponSchema } from "./wordpress-validator"

describe("createWordpressCouponSchema", () => {
  it("accepts a coupon description composed from email and phone", () => {
    const result = createWordpressCouponSchema.safeParse({
      description: "someone@example.com - 600000000",
      amount: 55,
      dateExpires: "2027-06-19",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe("someone@example.com - 600000000")
    }
  })

  it("rejects an empty description after trimming", () => {
    const result = createWordpressCouponSchema.safeParse({
      description: "   ",
      amount: 55,
      dateExpires: "2027-06-19",
    })

    expect(result.success).toBe(false)
  })
})
