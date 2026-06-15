"use client"

import { describe, expect, test } from "bun:test"
import type { Product } from "@/lib/domain/entities/product"
import {
  DEFAULT_PRODUCT_SORT,
  nextProductSortState,
  sortProducts,
} from "./product-sort-utils"

const PRODUCTS: Product[] = [
  {
    _id: "3",
    name: "Zeta",
    finalPrice: 30,
    stock: 2,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  },
  {
    _id: "1",
    name: "Alpha",
    finalPrice: 10,
    stock: 10,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  },
  {
    _id: "2",
    name: "Beta",
    finalPrice: 20,
    stock: undefined,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  },
]

describe("sortProducts", () => {
  test("defaults to name ascending", () => {
    expect(
      sortProducts(PRODUCTS, DEFAULT_PRODUCT_SORT).map((p) => p.name)
    ).toEqual(["Alpha", "Beta", "Zeta"])
  })

  test("sorts by final price descending", () => {
    expect(
      sortProducts(PRODUCTS, { sortBy: "finalPrice", sortDir: "desc" }).map(
        (p) => p.finalPrice
      )
    ).toEqual([30, 20, 10])
  })

  test("keeps products without stock at the end", () => {
    expect(
      sortProducts(PRODUCTS, { sortBy: "stock", sortDir: "asc" }).map(
        (p) => p._id
      )
    ).toEqual(["3", "1", "2"])
  })
})

describe("nextProductSortState", () => {
  test("toggles direction when clicking the active column", () => {
    expect(
      nextProductSortState({ sortBy: "name", sortDir: "asc" }, "name")
    ).toEqual({ sortBy: "name", sortDir: "desc" })
  })

  test("switches to the clicked column with ascending order", () => {
    expect(
      nextProductSortState({ sortBy: "name", sortDir: "desc" }, "finalPrice")
    ).toEqual({ sortBy: "finalPrice", sortDir: "asc" })
  })
})
