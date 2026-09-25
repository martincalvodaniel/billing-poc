import "server-only"

import {
  type InvoiceCounter,
  NUMBERED_INVOICE_SERIES,
  type NumberedInvoiceSeries,
} from "../../domain/entities/invoice"
import type { InvoiceCounterRepository } from "../../domain/ports/invoice-counter-repository"
import { getDatabase } from "../client"
import type { MongoInvoiceCounter } from "../types"

function toDomain(doc: MongoInvoiceCounter): InvoiceCounter {
  return {
    _id: doc._id?.toString(),
    series: doc.series,
    year: doc.year,
    lastNumber: doc.lastNumber,
    updatedAt: doc.updatedAt,
  }
}

export class MongoInvoiceCounterRepository implements InvoiceCounterRepository {
  private async collection() {
    const db = await getDatabase()
    return db.collection<MongoInvoiceCounter>("invoiceCounters")
  }

  async findAll(): Promise<InvoiceCounter[]> {
    const col = await this.collection()
    const docs = await col.find({}).sort({ year: -1, series: 1 }).toArray()
    return docs.map(toDomain)
  }

  async getNextNumber(
    series: NumberedInvoiceSeries,
    year: number
  ): Promise<number> {
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

  async getCurrentNumber(
    series: NumberedInvoiceSeries,
    year: number
  ): Promise<number> {
    const col = await this.collection()
    const counter = await col.findOne({ series, year })
    return counter?.lastNumber || 0
  }

  async setCurrentNumber(
    series: NumberedInvoiceSeries,
    year: number,
    expectedCurrentNumber: number,
    newLastNumber: number
  ): Promise<boolean> {
    const col = await this.collection()
    const result = await col.updateOne(
      { series, year, lastNumber: expectedCurrentNumber },
      { $set: { lastNumber: newLastNumber, updatedAt: new Date() } }
    )
    return result.modifiedCount > 0
  }

  /**
   * Initialize all invoice series for a given year with a starting number
   * (for setup/testing). Idempotent: existing counters are left untouched.
   */
  async initialize(year: number, startNumber = 0): Promise<void> {
    const col = await this.collection()
    const operations = NUMBERED_INVOICE_SERIES.map((series) => ({
      updateOne: {
        filter: { series, year },
        update: {
          $setOnInsert: {
            series,
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
