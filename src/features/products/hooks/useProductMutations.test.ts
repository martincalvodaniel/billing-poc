"use client"

import { describe, expect, test } from "bun:test"
import { buildProductsRequest } from "./useProductMutations"

describe("buildProductsRequest", () => {
  test("builds JSON POST request", () => {
    const body = {
      name: "Widget",
      finalPrice: "10",
      stock: "5",
    }
    const { url, init } = buildProductsRequest("POST", body)

    expect(url).toBe("/api/products")
    expect(init.method).toBe("POST")
    expect(init.credentials).toBe("same-origin")
    expect(init.headers).toEqual({ "Content-Type": "application/json" })
    expect(init.body).toBe(JSON.stringify(body))
  })

  test("builds PUT request with product id", () => {
    const body = { id: "abc123", stock: "4" }
    const { init } = buildProductsRequest("PUT", body)

    expect(init.method).toBe("PUT")
    expect(init.body).toBe(JSON.stringify(body))
  })

  test("builds DELETE request with id payload", () => {
    const body = { id: "abc123" }
    const { init } = buildProductsRequest("DELETE", body)

    expect(init.method).toBe("DELETE")
    expect(init.body).toBe(JSON.stringify(body))
  })
})
