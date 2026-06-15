import "server-only"

import type { InvoiceType } from "../../domain/entities/payment"
import type { InvoiceCounterRepository } from "../../domain/ports/invoice-counter-repository"
import { getDatabase } from "../client"
import type { MongoInvoiceCounter } from "../types"

export class MongoInvoiceCounterRepository implements InvoiceCounterRepository {
  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoInvoiceCounter>("invoiceCounters")
  }

  async getNextNumber(series: InvoiceType, year: number): Promise<number> {
    const col = await this.collection()
    const result = await col.findOneAndUpdate(
      { series, year },
      {
        $inc: { lastNumber: 1 },
        $set: { updatedAt: new Date() },
        $setOnInsert: { series, year },
      },
      { upsert: true, returnDocument: "after" }
    )

    if (!result) {
      throw new Error(
        `Failed to get invoice number for series: ${series}, year: ${year}`
      )
    }

    return result.lastNumber
  }

  async getCurrentNumber(series: InvoiceType, year: number): Promise<number> {
    const col = await this.collection()
    const counter = await col.findOne({ series, year })
    return counter?.lastNumber || 0
  }

  /**
   * Initialize all invoice series for a given year with a starting number
   * (for setup/testing). Idempotent: existing counters are left untouched.
   */
  async initialize(year: number, startNumber = 0): Promise<void> {
    const col = await this.collection()
    const series: InvoiceType[] = [
      "Invoice",
      "RectificativeInvoice",
      "SimpleInvoice",
      "RectificativeSimpleInvoice",
    ]

    const operations = series.map((s) => ({
      updateOne: {
        filter: { series: s, year },
        update: {
          $setOnInsert: {
            series: s,
            year,
            lastNumber: startNumber,
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }))

    await col.bulkWrite(operations)
  }
}
