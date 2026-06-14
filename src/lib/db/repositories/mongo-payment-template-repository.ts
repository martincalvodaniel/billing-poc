import "server-only"

import type { PaymentTemplate } from "@/lib/domain/entities/payment-template"
import type { PaymentTemplateRepository } from "@/lib/domain/ports/payment-template-repository"
import { getDatabase } from "../client"
import type { MongoPaymentTemplate } from "../types"
import { isValidObjectId, omitNullish, toObjectId } from "./mongo-utils"

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
}
