import type { Product } from "@/lib/domain/entities/product"
import {
  nextSortState as buildNextSortState,
  type SortDirection,
  type SortState,
} from "@/lib/utils/sort-state"

export type ProductSortKey = "name" | "finalPrice" | "stock"
type ProductSortDir = SortDirection
export type ProductSortState = SortState<ProductSortKey>

export const DEFAULT_PRODUCT_SORT: ProductSortState = {
  sortBy: "name",
  sortDir: "asc",
}

export function nextProductSortState(
  current: ProductSortState,
  clicked: ProductSortKey
): ProductSortState {
  return buildNextSortState(current, clicked, "asc")
}

function compareNullableNumbers(
  a: number | undefined,
  b: number | undefined,
  dir: ProductSortDir
): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  const cmp = a - b
  return dir === "asc" ? cmp : -cmp
}

function compareStrings(a: string, b: string, dir: ProductSortDir): number {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base" })
  return dir === "asc" ? cmp : -cmp
}

function compareProducts(
  a: Product,
  b: Product,
  sortBy: ProductSortKey,
  sortDir: ProductSortDir
): number {
  if (sortBy === "name") {
    return compareStrings(a.name, b.name, sortDir)
  }

  if (sortBy === "finalPrice") {
    return compareNullableNumbers(a.finalPrice, b.finalPrice, sortDir)
  }

  return compareNullableNumbers(a.stock, b.stock, sortDir)
}

export function sortProducts(
  products: Product[],
  sortState: ProductSortState = DEFAULT_PRODUCT_SORT
): Product[] {
  return [...products].sort((a, b) =>
    compareProducts(a, b, sortState.sortBy, sortState.sortDir)
  )
}
