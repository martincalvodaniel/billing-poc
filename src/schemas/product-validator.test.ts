import { describe, expect, test } from "bun:test"
import { createProductSchema, updateProductSchema } from "./product-validator"

describe("createProductSchema", () => {
  test("allows products without stock", () => {
    const result = createProductSchema.parse({
      name: "Widget",
      finalPrice: "10",
      stock: "",
    })

    expect(result).toEqual({
      name: "Widget",
      tag: undefined,
      finalPrice: 10,
      stock: undefined,
    })
  })

  test("trims product tags", () => {
    const result = createProductSchema.parse({
      name: "Widget",
      tag: "  Local  ",
      finalPrice: "10",
    })

    expect(result.tag).toBe("Local")
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

  test("allows clearing tag with a blank value", () => {
    const result = updateProductSchema.parse({
      id: "abc123",
      tag: "",
    })

    expect(result).toEqual({
      id: "abc123",
      tag: "",
    })
  })
})
