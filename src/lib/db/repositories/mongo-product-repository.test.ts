import { beforeAll, describe, expect, mock, test } from "bun:test"

mock.module("server-only", () => ({}))

process.env.MONGODB_URI ??= "mongodb://localhost:27017/test"

type BuildProductUpdateOps =
  typeof import("./mongo-product-repository")["buildProductUpdateOps"]

let buildProductUpdateOps: BuildProductUpdateOps
let buildProductStockAdjustmentFilter: typeof import("./mongo-product-repository")["buildProductStockAdjustmentFilter"]
let buildProductStockAdjustmentUpdate: typeof import("./mongo-product-repository")["buildProductStockAdjustmentUpdate"]

beforeAll(async () => {
  ;({
    buildProductUpdateOps,
    buildProductStockAdjustmentFilter,
    buildProductStockAdjustmentUpdate,
  } = await import("./mongo-product-repository"))
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

describe("buildProductStockAdjustmentFilter", () => {
  test("requires enough stock when decrementing", () => {
    expect(
      buildProductStockAdjustmentFilter("507f1f77bcf86cd799439011", -3)
    ).toEqual({
      _id: expect.any(Object),
      stock: { $gte: 3 },
    })
  })

  test("does not add a stock guard when incrementing", () => {
    expect(
      buildProductStockAdjustmentFilter("507f1f77bcf86cd799439011", 2)
    ).toEqual({
      _id: expect.any(Object),
    })
  })
})

describe("buildProductStockAdjustmentUpdate", () => {
  test("increments stock and refreshes updatedAt", () => {
    const ops = buildProductStockAdjustmentUpdate(-2)
    expect(ops.$inc).toEqual({ stock: -2 })
    expect(ops.$set?.updatedAt).toBeInstanceOf(Date)
  })
})
