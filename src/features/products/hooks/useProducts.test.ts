"use client"

import { describe, expect, test } from "bun:test"
import {
  buildProductsKey,
  buildProductsUrl,
  isProductsKey,
} from "./useProducts"

describe("buildProductsKey", () => {
  test("returns a stable tuple", () => {
    expect(buildProductsKey()).toEqual(["/api/products", "", ""])
    expect(buildProductsKey()).toEqual(buildProductsKey())
  })

  test("includes the search string when provided", () => {
    expect(buildProductsKey({ search: "widget" })).toEqual([
      "/api/products",
      "widget",
      "",
    ])
  })

  test("normalizes tags in the key", () => {
    expect(buildProductsKey({ tags: ["Market", " Local ", "Market"] })).toEqual(
      ["/api/products", "", "Local\u001fMarket"]
    )
  })
})

describe("buildProductsUrl", () => {
  test("returns the products endpoint", () => {
    expect(buildProductsUrl()).toBe("/api/products")
  })

  test("adds the search query when provided", () => {
    expect(buildProductsUrl({ search: "Widget Pro" })).toBe(
      "/api/products?search=Widget+Pro"
    )
  })

  test("adds selected tags as repeated query params", () => {
    expect(buildProductsUrl({ tags: ["Market", " Local "] })).toBe(
      "/api/products?tag=Local&tag=Market"
    )
  })
})

describe("isProductsKey", () => {
  test("detects the products key shape", () => {
    expect(isProductsKey(["/api/products", "", ""])).toBe(true)
    expect(isProductsKey(["/api/products", "widget", "Local"])).toBe(true)
  })

  test("rejects unrelated values", () => {
    expect(isProductsKey(["/api/payments"])).toBe(false)
    expect(isProductsKey([])).toBe(false)
    expect(isProductsKey("/api/products")).toBe(false)
  })
})
