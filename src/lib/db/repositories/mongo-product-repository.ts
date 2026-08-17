import { buildAccentInsensitivePattern } from "@/lib/utils/text-search"
import type { Product } from "../../domain/entities/product"
import type {
  ProductFilter,
  ProductRepository,
  ProductUpdateData,
} from "../../domain/ports/product-repository"
import { getDatabase } from "../client"
import type { MongoProduct } from "../types"
import {
  isValidObjectId,
  MongoUpdateBuilder,
  omitNullish,
  toObjectId,
} from "./mongo-utils"

function toDomain(doc: MongoProduct): Product {
  const product: Product = {
    _id: doc._id?.toString(),
    name: doc.name,
    tag: doc.tag,
    finalPrice: doc.finalPrice,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }

  if (doc.stock !== undefined && doc.stock !== null) {
    product.stock = doc.stock
  }

  return product
}

export function buildProductUpdateOps(data: ProductUpdateData) {
  const builder = new MongoUpdateBuilder().set("updatedAt", new Date())

  if (data.name !== undefined) builder.set("name", data.name.trim())
  if (data.tag !== undefined) {
    const trimmed = data.tag.trim()
    builder.setOrUnset("tag", trimmed ? trimmed : undefined)
  }
  if (data.finalPrice !== undefined) builder.set("finalPrice", data.finalPrice)
  if (data.stock !== undefined) builder.setOrUnset("stock", data.stock)

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

export function buildProductListQuery(
  filter: ProductFilter = {}
): Record<string, unknown> {
  const query: Record<string, unknown> = {}
  if (filter.search?.trim()) {
    const pattern = buildAccentInsensitivePattern(filter.search.trim())
    query.name = { $regex: pattern, $options: "i" }
  }
  if (filter.tags && filter.tags.length > 0) {
    query.tag = { $in: filter.tags }
  }
  return query
}

export class MongoProductRepository implements ProductRepository {
  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoProduct>("products")
  }

  async findAll(filter: ProductFilter = {}): Promise<Product[]> {
    const col = await this.collection()
    const docs = await col
      .find(buildProductListQuery(filter))
      .sort({ name: 1 })
      .toArray()
    return docs.map(toDomain)
  }

  async findDistinctTags(): Promise<string[]> {
    const col = await this.collection()
    const tags = await col.distinct("tag", {
      tag: { $type: "string", $ne: "" },
    })
    return tags
      .filter((tag): tag is string => typeof tag === "string")
      .sort((a, b) => a.localeCompare(b))
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
      tag: product.tag?.trim() ? product.tag.trim() : undefined,
      finalPrice: product.finalPrice,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })
    const result = await col.insertOne(doc as MongoProduct)
    return result.insertedId.toString()
  }

  async update(id: string, data: ProductUpdateData): Promise<boolean> {
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
