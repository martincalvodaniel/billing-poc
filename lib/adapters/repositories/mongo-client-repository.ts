import { ObjectId } from "mongodb"
import type { Client, PaginatedResponse } from "../../domain/entities/client"
import type {
  ClientFilter,
  ClientRepository,
} from "../../domain/ports/client-repository"
import { getDatabase } from "../../mongodb"
import type { Client as MongoClient } from "../../types"

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
}

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
      const escaped = escapeRegex(filter.search.trim())
      const searchPattern = { $regex: escaped, $options: "i" }
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
    const col = await this.collection()
    const doc = await col.findOne({ _id: toObjectId(id) })
    return doc ? toDomain(doc) : null
  }

  async create(client: Omit<Client, "_id">): Promise<string> {
    const col = await this.collection()
    const doc: Omit<MongoClient, "_id"> = {
      clientType: client.clientType,
      name: client.name,
      taxId: client.taxId,
      address: client.address,
      phone: client.phone,
      email: client.email,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }
    const result = await col.insertOne(doc as MongoClient)
    return result.insertedId.toString()
  }

  async update(id: string, data: Partial<Client>): Promise<boolean> {
    const col = await this.collection()
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (data.clientType !== undefined) updateData.clientType = data.clientType
    if (data.name !== undefined) updateData.name = data.name
    if (data.taxId !== undefined) updateData.taxId = data.taxId
    if (data.address !== undefined) updateData.address = data.address
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.email !== undefined) updateData.email = data.email

    const result = await col.updateOne(
      { _id: toObjectId(id) },
      { $set: updateData }
    )
    return result.matchedCount > 0
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.collection()
    const result = await col.deleteOne({ _id: toObjectId(id) })
    return result.deletedCount > 0
  }
}
