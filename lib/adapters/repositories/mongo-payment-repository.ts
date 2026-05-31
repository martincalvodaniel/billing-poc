import type { InvoiceMetadata, Payment } from "../../domain/entities/payment"
import type {
  PaymentFilter,
  PaymentRepository,
} from "../../domain/ports/payment-repository"
import { getDatabase } from "../../mongodb"
import type { MongoPayment } from "../../types"
import { mapPaymentDocToDomain } from "./mongo-payment-repository-utils"
import {
  isValidObjectId,
  MongoUpdateBuilder,
  omitNullish,
  toObjectId,
  type UpdateOps,
} from "./mongo-utils"

function toDomain(doc: MongoPayment): Payment {
  return mapPaymentDocToDomain(doc)
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function isoLocalDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function buildPaymentDateQuery(
  filter: PaymentFilter
): Record<string, unknown> {
  if (filter.year && filter.month) {
    const lastDay = new Date(filter.year, filter.month, 0).getDate()
    return {
      date: {
        $gte: isoLocalDate(filter.year, filter.month, 1),
        $lte: isoLocalDate(filter.year, filter.month, lastDay),
      },
    }
  }

  if (filter.year) {
    return {
      date: {
        $gte: isoLocalDate(filter.year, 1, 1),
        $lte: isoLocalDate(filter.year, 12, 31),
      },
    }
  }

  return {}
}

/**
 * Pure builder for the Mongo update document used by
 * `MongoPaymentRepository.update`. Extracted so it can be unit-tested
 * without touching the driver. Honours the repo conventions: optional
 * fields use `setOrUnset`, semantic-zero fields (`discount`) map 0 →
 * `$unset`, and `updatedAt` is always refreshed.
 */
export function buildPaymentUpdateOps(data: Partial<Payment>): UpdateOps {
  const builder = new MongoUpdateBuilder().set("updatedAt", new Date())

  if (data.type !== undefined) builder.set("type", data.type)
  if (data.date !== undefined) builder.set("date", data.date)
  if (data.tag !== undefined) {
    const trimmed = data.tag.trim()
    builder.setOrUnset("tag", trimmed ? trimmed : undefined)
  }
  if (data.clientId !== undefined) {
    builder.setOrUnset(
      "clientId",
      data.clientId ? toObjectId(data.clientId) : undefined
    )
  }
  if (data.concepts !== undefined) builder.set("concepts", data.concepts)
  if (data.vat !== undefined) builder.set("vat", data.vat)
  if (data.surcharge !== undefined) {
    // surcharge === 0 means "no surcharge" → remove the field entirely.
    builder.setOrUnset(
      "surcharge",
      data.surcharge !== 0 ? data.surcharge : undefined
    )
  }
  if (data.discount !== undefined) {
    // discount === 0 means "no discount" → remove the field entirely.
    builder.setOrUnset(
      "discount",
      data.discount && data.discount > 0 ? data.discount : undefined
    )
  }
  if (data.deliveryNoteRef !== undefined) {
    const trimmed = data.deliveryNoteRef.trim()
    builder.setOrUnset("deliveryNoteRef", trimmed ? trimmed : undefined)
  }
  if (data.total !== undefined) builder.set("total", data.total)
  if (data.netAmount !== undefined) builder.set("netAmount", data.netAmount)
  if (data.vatAmount !== undefined) builder.set("vatAmount", data.vatAmount)
  if (data.surchargeAmount !== undefined) {
    builder.setOrUnset(
      "surchargeAmount",
      data.surchargeAmount !== 0
        ? data.surchargeAmount
        : undefined
    )
  }
  if (data.invoice !== undefined) builder.setOrUnset("invoice", data.invoice)
  if (data.paymentMethod !== undefined) {
    builder.setOrUnset(
      "paymentMethod",
      data.paymentMethod ? data.paymentMethod : undefined
    )
  }

  return builder.build()
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
      typeof payment.surchargeAmount === "number" && payment.surchargeAmount !== 0
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
