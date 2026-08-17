"use client"

import { describe, expect, test } from "bun:test"
import {
  buildProductTagsKey,
  buildProductTagsUrl,
  isProductTagsKey,
} from "./useProductTags"

describe("buildProductTagsKey", () => {
  test("returns a stable tuple for product tags", () => {
    expect(buildProductTagsKey()).toEqual(["/api/products/tags"])
  })
})

describe("buildProductTagsUrl", () => {
  test("returns the product tags endpoint", () => {
    expect(buildProductTagsUrl()).toBe("/api/products/tags")
  })
})

describe("isProductTagsKey", () => {
  test("detects product tag keys", () => {
    expect(isProductTagsKey(["/api/products/tags"])).toBe(true)
  })

  test("rejects unrelated values", () => {
    expect(isProductTagsKey(["/api/tags"])).toBe(false)
    expect(isProductTagsKey(["/api/products/tags", "extra"])).toBe(false)
    expect(isProductTagsKey("/api/products/tags")).toBe(false)
  })
})
