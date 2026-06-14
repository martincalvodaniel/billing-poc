import { describe, expect, test } from "bun:test"
import { createProductSchema, updateProductSchema } from "./product-validator"

describe("createProductSchema", () => {
  test("allows products without stock", () => {
    const result = createProductSchema.parse({
      name: "Widget",
      finalPrice: "10",
      taxes: "21",
      stock: "",
    })

    expect(result).toEqual({
      name: "Widget",
      finalPrice: 10,
      taxes: 21,
      stock: undefined,
    })
  })
})

describe("updateProductSchema", () => {
  test("allows omitting stock when updating other fields", () => {
    const result = updateProductSchema.parse({
      id: "abc123",
      name: "Widget Pro",
    })

    expect(result).toEqual({
      id: "abc123",
      name: "Widget Pro",
    })
  })

  test("allows clearing stock with a blank value", () => {
    const result = updateProductSchema.parse({
      id: "abc123",
      stock: "",
    })

    expect(result).toEqual({
      id: "abc123",
      stock: null,
    })
  })
})
