import type { InvoiceMetadata, Payment } from "../../domain/entities/payment"
import type {
  PaymentFilter,
  PaymentRepository,
} from "../../domain/ports/payment-repository"
import { getDatabase } from "../client"
import type { MongoPayment } from "../types"
import {
  buildPaymentDateQuery,
  buildPaymentUpdateOps,
} from "./mongo-payment-repository-query"
import { mapPaymentDocToDomain } from "./mongo-payment-repository-utils"
import { isValidObjectId, omitNullish, toObjectId } from "./mongo-utils"

// Re-export the pure query/update builders so existing tests and consumers can
// keep importing them from this module.
export {
  buildPaymentDateQuery,
  buildPaymentUpdateOps,
} from "./mongo-payment-repository-query"

function toDomain(doc: MongoPayment): Payment {
  return mapPaymentDocToDomain(doc)
}

export class MongoPaymentRepository implements PaymentRepository {
  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoPayment>("payments")
  }

  async findAll(filter: PaymentFilter): Promise<Payment[]> {
    const col = await this.collection()
    const query = buildPaymentDateQuery(filter)

    const docs = await col
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray()

    return docs.map(toDomain)
  }

  async findById(id: string): Promise<Payment | null> {
    if (!isValidObjectId(id)) return null
    const col = await this.collection()
    const doc = await col.findOne({ _id: toObjectId(id) })
    return doc ? toDomain(doc) : null
  }

  async create(payment: Omit<Payment, "_id">): Promise<string> {
    const col = await this.collection()
    const tag = payment.tag?.trim() ? payment.tag.trim() : undefined
    const deliveryNoteRef = payment.deliveryNoteRef?.trim()
      ? payment.deliveryNoteRef.trim()
      : undefined
    const discount =
      typeof payment.discount === "number" && payment.discount > 0
        ? payment.discount
        : undefined
    const surcharge =
      typeof payment.surcharge === "number" && payment.surcharge !== 0
        ? payment.surcharge
        : undefined
    const surchargeAmount =
      typeof payment.surchargeAmount === "number" &&
      payment.surchargeAmount !== 0
        ? payment.surchargeAmount
        : undefined
    const doc = omitNullish({
      type: payment.type,
      date: payment.date,
      tag,
      clientId: payment.clientId ? toObjectId(payment.clientId) : undefined,
      concepts: payment.concepts,
      vat: payment.vat,
      surcharge,
      discount,
      deliveryNoteRef,
      netAmount: payment.netAmount,
      vatAmount: payment.vatAmount,
      surchargeAmount,
      total: payment.total,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    })
    const result = await col.insertOne(doc as MongoPayment)
    return result.insertedId.toString()
  }

  async update(id: string, data: Partial<Payment>): Promise<boolean> {
    if (!isValidObjectId(id)) return false
    const col = await this.collection()
    const result = await col.updateOne(
      { _id: toObjectId(id) },
      buildPaymentUpdateOps(data)
    )
    return result.matchedCount > 0
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false
    const col = await this.collection()
    const result = await col.deleteOne({ _id: toObjectId(id) })
    return result.deletedCount > 0
  }

  /**
   * Atomically append an invoice to `payment.invoices`. If the legacy
   * `payment.invoice` single field is still present, lift it into the array
   * first (in the same write) and unset the legacy field.
   */
  async appendInvoice(
    paymentId: string,
    invoice: InvoiceMetadata
  ): Promise<boolean> {
    if (!isValidObjectId(paymentId)) return false
    const col = await this.collection()
    const _id = toObjectId(paymentId)
    const existing = await col.findOne({ _id }, { projection: { invoice: 1 } })
    if (!existing) return false

    const updatedAt = new Date()

    if (existing.invoice) {
      // Lift the legacy single-invoice field into the array alongside the
      // new entry, and unset the legacy field — single atomic write.
      const each: InvoiceMetadata[] = [
        existing.invoice as InvoiceMetadata,
        invoice,
      ]
      const result = await col.updateOne(
        { _id },
        {
          $push: { invoices: { $each: each } },
          $unset: { invoice: "" },
          $set: { updatedAt },
        }
      )
      return result.matchedCount > 0
    }

    const result = await col.updateOne(
      { _id },
      {
        $push: { invoices: invoice },
        $set: { updatedAt },
      }
    )
    return result.matchedCount > 0
  }

  /**
   * Pull a link-only invoice entry (one without an `id`) from
   * `payment.invoices` matching the given `link`. Returns `true` only when
   * an entry was actually removed (`modifiedCount > 0`) so the caller can
   * distinguish "found but nothing pulled" → 404 from a successful delete.
   */
  async removeLinkInvoice(paymentId: string, link: string): Promise<boolean> {
    if (!isValidObjectId(paymentId)) return false
    const col = await this.collection()
    const _id = toObjectId(paymentId)
    const result = await col.updateOne(
      { _id },
      {
        $pull: {
          invoices: {
            link,
            $or: [{ id: { $exists: false } }, { id: "" }],
          },
        },
        $set: { updatedAt: new Date() },
      }
    )
    return result.modifiedCount > 0
  }

  async findDistinctTags(type?: string): Promise<string[]> {
    const col = await this.collection()
    const matchStage: Record<string, unknown> = {
      tag: { $type: "string", $ne: "" },
    }
    if (type === "income" || type === "outcome") {
      matchStage.type = type
    }

    const result = await col
      .aggregate([
        { $match: matchStage },
        { $group: { _id: null, tags: { $addToSet: "$tag" } } },
        { $project: { _id: 0, tags: 1 } },
      ])
      .toArray()

    return result.length > 0 ? (result[0] as { tags: string[] }).tags : []
  }
}
