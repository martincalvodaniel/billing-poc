import { ObjectId } from "mongodb"
import type { Payment } from "../../domain/entities/payment"
import type {
  PaymentFilter,
  PaymentRepository,
} from "../../domain/ports/payment-repository"
import { getDatabase } from "../../mongodb"
import type { Payment as MongoPayment } from "../../types"
import { MongoUpdateBuilder, omitNullish } from "./mongo-utils"

function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
}

function toDomain(doc: MongoPayment): Payment {
  return {
    _id: doc._id?.toString(),
    type: doc.type,
    date: doc.date,
    tag: doc.tag,
    clientId: doc.clientId?.toString(),
    concepts: doc.concepts,
    vat: doc.vat,
    surcharge: doc.surcharge,
    discount: doc.discount,
    deliveryNoteRef: doc.deliveryNoteRef,
    netAmount: doc.netAmount,
    vatAmount: doc.vatAmount,
    surchargeAmount: doc.surchargeAmount,
    total: doc.total,
    invoice: doc.invoice,
    providerBillUrl: doc.providerBillUrl,
    providerBillPathname: doc.providerBillPathname,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export class MongoPaymentRepository implements PaymentRepository {
  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoPayment>("payments")
  }

  async findAll(filter: PaymentFilter): Promise<Payment[]> {
    const col = await this.collection()
    const query: Record<string, unknown> = {}

    if (filter.year && filter.month) {
      const startDate = new Date(filter.year, filter.month - 1, 1)
      const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59, 999)
      query.date = {
        $gte: startDate.toISOString().split("T")[0],
        $lte: endDate.toISOString().split("T")[0],
      }
    } else if (filter.year) {
      const startDate = new Date(filter.year, 0, 1)
      const endDate = new Date(filter.year, 11, 31, 23, 59, 59, 999)
      query.date = {
        $gte: startDate.toISOString().split("T")[0],
        $lte: endDate.toISOString().split("T")[0],
      }
    }

    const docs = await col
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray()

    return docs.map(toDomain)
  }

  async findById(id: string): Promise<Payment | null> {
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
    const doc = omitNullish({
      type: payment.type,
      date: payment.date,
      tag,
      clientId: payment.clientId ? toObjectId(payment.clientId) : undefined,
      concepts: payment.concepts,
      vat: payment.vat,
      surcharge: payment.surcharge,
      discount,
      deliveryNoteRef,
      netAmount: payment.netAmount,
      vatAmount: payment.vatAmount,
      surchargeAmount: payment.surchargeAmount,
      total: payment.total,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    })
    const result = await col.insertOne(doc as MongoPayment)
    return result.insertedId.toString()
  }

  async update(id: string, data: Partial<Payment>): Promise<boolean> {
    const col = await this.collection()
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
    if (data.surcharge !== undefined) builder.set("surcharge", data.surcharge)
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
      builder.set("surchargeAmount", data.surchargeAmount)
    }
    if (data.invoice !== undefined) builder.setOrUnset("invoice", data.invoice)
    if (data.providerBillUrl !== undefined) {
      builder.setOrUnset("providerBillUrl", data.providerBillUrl)
    }
    if (data.providerBillPathname !== undefined) {
      builder.setOrUnset("providerBillPathname", data.providerBillPathname)
    }

    const result = await col.updateOne({ _id: toObjectId(id) }, builder.build())
    return result.matchedCount > 0
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.collection()
    const result = await col.deleteOne({ _id: toObjectId(id) })
    return result.deletedCount > 0
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
