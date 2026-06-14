import { beforeAll, describe, expect, mock, test } from "bun:test"

mock.module("server-only", () => ({}))

process.env.MONGODB_URI ??= "mongodb://localhost:27017/test"

type BuildProductUpdateOps =
  typeof import("./mongo-product-repository")["buildProductUpdateOps"]

let buildProductUpdateOps: BuildProductUpdateOps

beforeAll(async () => {
  ;({ buildProductUpdateOps } = await import("./mongo-product-repository"))
})

describe("buildProductUpdateOps", () => {
  test("always refreshes updatedAt", () => {
    const ops = buildProductUpdateOps({})
    expect(ops.$set?.updatedAt).toBeInstanceOf(Date)
  })

  test("sets numeric fields when provided", () => {
    const ops = buildProductUpdateOps({
      finalPrice: 12.5,
      taxes: 21,
      stock: 4,
    })
    expect(ops.$set?.finalPrice).toBe(12.5)
    expect(ops.$set?.taxes).toBe(21)
    expect(ops.$set?.stock).toBe(4)
  })

  test("trims the product name before persisting", () => {
    const ops = buildProductUpdateOps({ name: "  Product A  " })
    expect(ops.$set?.name).toBe("Product A")
  })
})
