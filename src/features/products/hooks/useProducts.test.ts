"use client"

import { describe, expect, test } from "bun:test"
import {
  buildProductsKey,
  buildProductsUrl,
  isProductsKey,
} from "./useProducts"

describe("buildProductsKey", () => {
  test("returns a stable tuple", () => {
    expect(buildProductsKey()).toEqual(["/api/products"])
    expect(buildProductsKey()).toEqual(buildProductsKey())
  })
})

describe("buildProductsUrl", () => {
  test("returns the products endpoint", () => {
    expect(buildProductsUrl()).toBe("/api/products")
  })
})

describe("isProductsKey", () => {
  test("detects the products key shape", () => {
    expect(isProductsKey(["/api/products"])).toBe(true)
  })

  test("rejects unrelated values", () => {
    expect(isProductsKey(["/api/payments"])).toBe(false)
    expect(isProductsKey([])).toBe(false)
    expect(isProductsKey("/api/products")).toBe(false)
  })
})
