import { MongoProductRepository } from "@/lib/db/repositories/mongo-product-repository"

const products = new MongoProductRepository()

interface ProductSaleConcept {
  productId?: string
  name: string
  quantity: number
}

type ProductStockChange = { productId: string; quantity: number; name: string }

function getProductSaleConcepts(
  concepts: ProductSaleConcept[]
): ProductStockChange[] {
  return concepts
    .filter((concept) => concept.productId)
    .map((concept) => ({
      productId: concept.productId as string,
      quantity: Number(concept.quantity),
      name: concept.name,
    }))
}

export async function rollbackProductStockChanges(
  changes: ProductStockChange[]
) {
  for (const change of [...changes].reverse()) {
    await products.adjustStock(change.productId, change.quantity)
  }
}

export async function reserveProductStockForSale(
  concepts: ProductSaleConcept[]
): Promise<
  | { success: true; changes: ProductStockChange[] }
  | { success: false; error: string }
> {
  const changes = getProductSaleConcepts(concepts)
  const appliedChanges: ProductStockChange[] = []

  for (const change of changes) {
    if (!Number.isInteger(change.quantity) || change.quantity <= 0) {
      await rollbackProductStockChanges(appliedChanges)
      return {
        success: false,
        error: `Invalid quantity for product ${change.name}`,
      }
    }

    const product = await products.findById(change.productId)
    if (!product) {
      await rollbackProductStockChanges(appliedChanges)
      return {
        success: false,
        error: `Product not found for concept ${change.name}`,
      }
    }

    if (product.stock == null) {
      continue
    }

    const decremented = await products.adjustStock(
      change.productId,
      -change.quantity
    )
    if (!decremented) {
      await rollbackProductStockChanges(appliedChanges)
      return {
        success: false,
        error: `Insufficient stock for product ${change.name}`,
      }
    }

    appliedChanges.push(change)
  }

  return { success: true, changes: appliedChanges }
}
