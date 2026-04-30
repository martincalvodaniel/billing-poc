import type { InvoiceSeries } from "../../domain/entities/payment"
import type { InvoiceCounterRepository } from "../../domain/ports/invoice-counter-repository"
import { getDatabase } from "../../mongodb"
import type { InvoiceCounter } from "../../types"

export class MongoInvoiceCounterRepository implements InvoiceCounterRepository {
  private async collection() {
    const db = await getDatabase()
    return db.collection<InvoiceCounter>("invoiceCounters")
  }

  async getNextNumber(series: InvoiceSeries): Promise<number> {
    const col = await this.collection()
    const result = await col.findOneAndUpdate(
      { series },
      {
        $inc: { lastNumber: 1 },
        $set: { updatedAt: new Date() },
      },
      { upsert: true, returnDocument: "after" }
    )

    if (!result) {
      throw new Error(`Failed to get invoice number for series: ${series}`)
    }

    return result.lastNumber
  }

  async getCurrentNumber(series: InvoiceSeries): Promise<number> {
    const col = await this.collection()
    const counter = await col.findOne({ series })
    return counter?.lastNumber || 0
  }
}
