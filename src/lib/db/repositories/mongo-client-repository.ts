import "server-only"

import { buildAccentInsensitivePattern } from "@/lib/utils/text-search"
import type { Client, PaginatedResponse } from "../../domain/entities/client"
import type {
  ClientFilter,
  ClientRepository,
  ClientUpdateData,
} from "../../domain/ports/client-repository"
import { getDatabase } from "../client"
import type { MongoClient } from "../types"
import {
  isValidObjectId,
  MongoUpdateBuilder,
  omitNullish,
  toObjectId,
} from "./mongo-utils"

function toDomain(doc: MongoClient): Client {
  return {
    _id: doc._id?.toString(),
    clientType: doc.clientType,
    name: doc.name,
    taxId: doc.taxId,
    address: doc.address,
    phone: doc.phone,
    email: doc.email,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export class MongoClientRepository implements ClientRepository {
  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoClient>("clients")
  }

  async findAll(filter: ClientFilter): Promise<PaginatedResponse<Client>> {
    const col = await this.collection()
    const query: Record<string, unknown> = {}

    if (filter.search?.trim()) {
      const pattern = buildAccentInsensitivePattern(filter.search.trim())
      const searchPattern = { $regex: pattern, $options: "i" }
      query.$or = [{ name: searchPattern }, { taxId: searchPattern }]
    }

    const total = await col.countDocuments(query)
    const skip = (filter.page - 1) * filter.pageSize
    const docs = await col
      .find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(filter.pageSize)
      .toArray()

    const totalPages = Math.ceil(total / filter.pageSize)

    return {
      items: docs.map(toDomain),
      pagination: {
        page: filter.page,
        pageSize: filter.pageSize,
        total,
        totalPages,
        hasNextPage: filter.page < totalPages,
        hasPrevPage: filter.page > 1,
      },
    }
  }

  async findById(id: string): Promise<Client | null> {
    if (!isValidObjectId(id)) return null
    const col = await this.collection()
    const doc = await col.findOne({ _id: toObjectId(id) })
    return doc ? toDomain(doc) : null
  }

  async create(client: Omit<Client, "_id">): Promise<string> {
    const col = await this.collection()
    const doc = omitNullish({
      clientType: client.clientType,
      name: client.name,
      taxId: client.taxId,
      address: client.address,
      phone: client.phone,
      email: client.email,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    })
    const result = await col.insertOne(doc as MongoClient)
    return result.insertedId.toString()
  }

  async update(id: string, data: ClientUpdateData): Promise<boolean> {
    if (!isValidObjectId(id)) return false
    const col = await this.collection()
    const builder = new MongoUpdateBuilder().set("updatedAt", new Date())

    if (data.clientType !== undefined)
      builder.set("clientType", data.clientType)
    if (data.name !== undefined) builder.set("name", data.name)
    if (data.taxId !== undefined) builder.setOrUnset("taxId", data.taxId)
    if (data.address !== undefined) builder.setOrUnset("address", data.address)
    if (data.phone !== undefined) builder.setOrUnset("phone", data.phone)
    if (data.email !== undefined) builder.setOrUnset("email", data.email)

    const result = await col.updateOne({ _id: toObjectId(id) }, builder.build())
    return result.matchedCount > 0
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false
    const col = await this.collection()
    const result = await col.deleteOne({ _id: toObjectId(id) })
    return result.deletedCount > 0
  }

  async findAllNames(query?: string): Promise<string[]> {
    const col = await this.collection()
    const filter: Record<string, unknown> = {}

    if (query?.trim()) {
      const pattern = buildAccentInsensitivePattern(query.trim())
      filter.name = { $regex: pattern, $options: "i" }
    }

    const docs = await col
      .find(filter)
      .project<{ name: string }>({ name: 1, _id: 0 })
      .sort({ name: 1 })
      .collation({ locale: "en", strength: 2 })
      .toArray()

    return docs.map((d) => d.name)
  }
}
