"use client"

import { describe, expect, test } from "bun:test"
import {
  buildCreateWordpressCouponRequest,
  buildDeleteWordpressCouponRequest,
} from "./useWordpressCouponMutations"
import {
  buildWordpressCouponsKey,
  buildWordpressCouponsUrl,
  isWordpressCouponsKey,
} from "./useWordpressCoupons"

describe("WordPress coupon query helpers", () => {
  test("builds a stable paginated key and URL", () => {
    expect(buildWordpressCouponsKey({ page: 2 })).toEqual([
      "/api/wordpress/coupons",
      2,
    ])
    expect(buildWordpressCouponsUrl({ page: 2 })).toBe(
      "/api/wordpress/coupons?page=2"
    )
  })

  test("identifies coupon cache keys", () => {
    expect(isWordpressCouponsKey(["/api/wordpress/coupons", 1])).toBe(true)
    expect(isWordpressCouponsKey(["/api/wordpress/coupons", "1"])).toBe(false)
  })
})

describe("WordPress coupon mutation request builders", () => {
  test("builds a create request", () => {
    const input = {
      description: "someone@example.com",
      amount: "55",
      dateExpires: "2027-06-19",
    }
    expect(buildCreateWordpressCouponRequest(input)).toEqual({
      url: "/api/wordpress/coupons",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(input),
      },
    })
  })

  test("builds a delete request", () => {
    expect(buildDeleteWordpressCouponRequest({ couponId: 4688 })).toEqual({
      url: "/api/wordpress/coupons/4688",
      init: { method: "DELETE", credentials: "same-origin" },
    })
  })
})
