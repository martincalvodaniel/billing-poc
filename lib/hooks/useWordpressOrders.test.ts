import { describe, expect, test } from "bun:test"
import {
  buildWordpressOrdersKey,
  buildWordpressOrdersUrl,
  isWordpressOrdersKey,
} from "./useWordpressOrders"

describe("buildWordpressOrdersKey", () => {
  test("returns a stable tuple for the same page", () => {
    const a = buildWordpressOrdersKey({ page: 1 })
    const b = buildWordpressOrdersKey({ page: 1 })
    expect(a).toEqual(b)
    expect(a).toEqual(["/api/wordpress/orders", 1])
  })

  test("differentiates pages", () => {
    expect(buildWordpressOrdersKey({ page: 1 })).not.toEqual(
      buildWordpressOrdersKey({ page: 2 })
    )
  })
})

describe("buildWordpressOrdersUrl", () => {
  test("includes page query param", () => {
    expect(buildWordpressOrdersUrl({ page: 3 })).toBe(
      "/api/wordpress/orders?page=3"
    )
  })

  test("encodes numeric page", () => {
    expect(buildWordpressOrdersUrl({ page: 42 })).toBe(
      "/api/wordpress/orders?page=42"
    )
  })
})

describe("isWordpressOrdersKey", () => {
  test("returns true for valid key", () => {
    expect(isWordpressOrdersKey(["/api/wordpress/orders", 1])).toBe(true)
  })

  test("returns false for invalid key shapes", () => {
    expect(isWordpressOrdersKey(["/api/wordpress/orders"])).toBe(false)
    expect(isWordpressOrdersKey(["/api/wordpress/orders", "1"])).toBe(false)
    expect(isWordpressOrdersKey(["/api/payments", 1])).toBe(false)
    expect(isWordpressOrdersKey("/api/wordpress/orders?page=1")).toBe(false)
    expect(isWordpressOrdersKey(null)).toBe(false)
  })
})
