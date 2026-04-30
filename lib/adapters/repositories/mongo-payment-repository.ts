import { ObjectId } from "mongodb"
import type { Payment } from "../../domain/entities/payment"
import type {
  PaymentFilter,
  PaymentRepository,
} from "../../domain/ports/payment-repository"
import { getDatabase } from "../../mongodb"
import type { Payment as MongoPayment } from "../../types"

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
    const doc: Omit<MongoPayment, "_id"> = {
      type: payment.type,
      date: payment.date,
      tag: payment.tag,
      clientId: payment.clientId ? toObjectId(payment.clientId) : undefined,
      concepts: payment.concepts,
      vat: payment.vat,
      surcharge: payment.surcharge,
      deliveryNoteRef: payment.deliveryNoteRef,
      netAmount: payment.netAmount,
      vatAmount: payment.vatAmount,
      surchargeAmount: payment.surchargeAmount,
      total: payment.total,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }
    const result = await col.insertOne(doc as MongoPayment)
    return result.insertedId.toString()
  }

  async update(id: string, data: Partial<Payment>): Promise<boolean> {
    const col = await this.collection()
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (data.type !== undefined) updateData.type = data.type
    if (data.date !== undefined) updateData.date = data.date
    if (data.tag !== undefined) updateData.tag = data.tag || null
    if (data.clientId !== undefined) {
      updateData.clientId = data.clientId ? toObjectId(data.clientId) : null
    }
    if (data.concepts !== undefined) updateData.concepts = data.concepts
    if (data.vat !== undefined) updateData.vat = data.vat
    if (data.surcharge !== undefined) {
      updateData.surcharge = data.surcharge || null
    }
    if (data.deliveryNoteRef !== undefined) {
      updateData.deliveryNoteRef = data.deliveryNoteRef
    }
    if (data.total !== undefined) updateData.total = data.total
    if (data.netAmount !== undefined) updateData.netAmount = data.netAmount
    if (data.vatAmount !== undefined) updateData.vatAmount = data.vatAmount
    if (data.surchargeAmount !== undefined) {
      updateData.surchargeAmount = data.surchargeAmount
    }
    if (data.invoice !== undefined) updateData.invoice = data.invoice
    if (data.providerBillUrl !== undefined) {
      updateData.providerBillUrl = data.providerBillUrl
    }
    if (data.providerBillPathname !== undefined) {
      updateData.providerBillPathname = data.providerBillPathname
    }

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
