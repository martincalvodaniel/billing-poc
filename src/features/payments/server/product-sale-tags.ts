export type ProductSaleTag = "LocalSale" | "MarketSale" | "Cocción"

export function isProductSaleTag(
  tag: string | undefined
): tag is ProductSaleTag {
  return tag === "LocalSale" || tag === "MarketSale" || tag === "Cocción"
}
