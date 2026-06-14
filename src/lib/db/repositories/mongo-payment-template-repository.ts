import "server-only"

import type { PaymentTemplate } from "@/lib/domain/entities/payment-template"
import type {
  PaymentTemplateRepository,
  PaymentTemplateUpdateData,
} from "@/lib/domain/ports/payment-template-repository"
import { getDatabase } from "../client"
import type { MongoPaymentTemplate } from "../types"
import {
  isValidObjectId,
  MongoUpdateBuilder,
  omitNullish,
  toObjectId,
} from "./mongo-utils"

function toDomain(doc: MongoPaymentTemplate): PaymentTemplate {
  return {
    _id: doc._id?.toString(),
    name: doc.name,
    type: doc.type,
    concepts: doc.concepts,
    vat: doc.vat,
    surcharge: doc.surcharge,
    discount: doc.discount,
    tag: doc.tag,
    clientId: doc.clientId,
    deliveryNoteRef: doc.deliveryNoteRef,
    paymentMethod: doc.paymentMethod,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export class MongoPaymentTemplateRepository
  implements PaymentTemplateRepository
{
  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoPaymentTemplate>("paymentTemplates")
  }

  async findAll(): Promise<PaymentTemplate[]> {
    const col = await this.collection()
    const docs = await col.find({}).sort({ name: 1 }).toArray()
    return docs.map(toDomain)
  }

  async findById(id: string): Promise<PaymentTemplate | null> {
    if (!isValidObjectId(id)) return null
    const col = await this.collection()
    const doc = await col.findOne({ _id: toObjectId(id) })
    return doc ? toDomain(doc) : null
  }

  async create(template: Omit<PaymentTemplate, "_id">): Promise<string> {
    const col = await this.collection()
    const doc = omitNullish({
      name: template.name.trim(),
      type: template.type,
      concepts: template.concepts,
      vat: template.vat,
      surcharge: template.surcharge,
      discount: template.discount,
      tag: template.tag?.trim() ? template.tag.trim() : undefined,
      clientId: template.clientId?.trim()
        ? template.clientId.trim()
        : undefined,
      deliveryNoteRef: template.deliveryNoteRef?.trim()
        ? template.deliveryNoteRef.trim()
        : undefined,
      paymentMethod: template.paymentMethod,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    })
    const result = await col.insertOne(doc as MongoPaymentTemplate)
    return result.insertedId.toString()
  }

  async update(id: string, data: PaymentTemplateUpdateData): Promise<boolean> {
    if (!isValidObjectId(id)) return false
    const col = await this.collection()
    const builder = new MongoUpdateBuilder().set("updatedAt", new Date())

    if (data.name !== undefined) builder.set("name", data.name.trim())
    if (data.type !== undefined) builder.set("type", data.type)
    if (data.concepts !== undefined) builder.set("concepts", data.concepts)
    if (data.vat !== undefined) builder.set("vat", data.vat)
    if (data.surcharge !== undefined) {
      builder.setOrUnset("surcharge", data.surcharge !== 0 ? data.surcharge : 0)
    }
    if (data.discount !== undefined) {
      builder.setOrUnset("discount", data.discount > 0 ? data.discount : null)
    }
    if (data.tag !== undefined) {
      const trimmedTag = data.tag.trim()
      builder.setOrUnset("tag", trimmedTag ? trimmedTag : undefined)
    }
    if (data.clientId !== undefined) {
      const trimmedClientId = data.clientId.trim()
      builder.setOrUnset(
        "clientId",
        trimmedClientId ? trimmedClientId : undefined
      )
    }
    if (data.deliveryNoteRef !== undefined) {
      const trimmedDeliveryNoteRef = data.deliveryNoteRef.trim()
      builder.setOrUnset(
        "deliveryNoteRef",
        trimmedDeliveryNoteRef ? trimmedDeliveryNoteRef : undefined
      )
    }
    if (data.paymentMethod !== undefined) {
      builder.setOrUnset("paymentMethod", data.paymentMethod)
    }

    const result = await col.updateOne({ _id: toObjectId(id) }, builder.build())
    return result.matchedCount > 0
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false
    const col = await this.collection()
    const result = await col.deleteOne({ _id: toObjectId(id) })
    return result.deletedCount > 0
  }
}
