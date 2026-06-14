import type { Product } from "../../domain/entities/product"
import type { ProductRepository } from "../../domain/ports/product-repository"
import { getDatabase } from "../client"
import type { MongoProduct } from "../types"
import {
  isValidObjectId,
  MongoUpdateBuilder,
  omitNullish,
  toObjectId,
} from "./mongo-utils"

function toDomain(doc: MongoProduct): Product {
  return {
    _id: doc._id?.toString(),
    name: doc.name,
    finalPrice: doc.finalPrice,
    taxes: doc.taxes,
    stock: doc.stock,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export function buildProductUpdateOps(data: Partial<Omit<Product, "_id">>) {
  const builder = new MongoUpdateBuilder().set("updatedAt", new Date())

  if (data.name !== undefined) builder.set("name", data.name.trim())
  if (data.finalPrice !== undefined) builder.set("finalPrice", data.finalPrice)
  if (data.taxes !== undefined) builder.set("taxes", data.taxes)
  if (data.stock !== undefined) builder.set("stock", data.stock)

  return builder.build()
}

export function buildProductStockAdjustmentFilter(
  id: string,
  delta: number
): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    _id: toObjectId(id),
  }

  if (delta < 0) {
    filter.stock = { $gte: Math.abs(delta) }
  }

  return filter
}

export function buildProductStockAdjustmentUpdate(
  delta: number
): Record<string, unknown> {
  return {
    $inc: { stock: delta },
    $set: { updatedAt: new Date() },
  }
}

export class MongoProductRepository implements ProductRepository {
  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoProduct>("products")
  }

  async findAll(): Promise<Product[]> {
    const col = await this.collection()
    const docs = await col.find({}).sort({ name: 1 }).toArray()
    return docs.map(toDomain)
  }

  async findById(id: string): Promise<Product | null> {
    if (!isValidObjectId(id)) return null
    const col = await this.collection()
    const doc = await col.findOne({ _id: toObjectId(id) })
    return doc ? toDomain(doc) : null
  }

  async create(product: Omit<Product, "_id">): Promise<string> {
    const col = await this.collection()
    const doc = omitNullish({
      name: product.name.trim(),
      finalPrice: product.finalPrice,
      taxes: product.taxes,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })
    const result = await col.insertOne(doc as MongoProduct)
    return result.insertedId.toString()
  }

  async update(
    id: string,
    data: Partial<Omit<Product, "_id">>
  ): Promise<boolean> {
    if (!isValidObjectId(id)) return false
    const col = await this.collection()
    const result = await col.updateOne(
      { _id: toObjectId(id) },
      buildProductUpdateOps(data)
    )
    return result.matchedCount > 0
  }

  async adjustStock(id: string, delta: number): Promise<boolean> {
    if (!isValidObjectId(id)) return false
    if (delta === 0) return true

    const col = await this.collection()
    const result = await col.updateOne(
      buildProductStockAdjustmentFilter(id, delta),
      buildProductStockAdjustmentUpdate(delta)
    )
    return result.matchedCount > 0 && result.modifiedCount > 0
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false
    const col = await this.collection()
    const result = await col.deleteOne({ _id: toObjectId(id) })
    return result.deletedCount > 0
  }
}
