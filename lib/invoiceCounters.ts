import { getDatabase } from "./mongodb"
import type { InvoiceCounter, InvoiceSeries } from "./types"

/**
 * Get and increment the invoice counter for a specific series + year.
 * Returns the next sequential number scoped to (series, year).
 */
export async function getNextInvoiceNumber(
  series: InvoiceSeries,
  year: number
): Promise<number> {
  const db = await getDatabase()

  const result = await db
    .collection<InvoiceCounter>("invoiceCounters")
    .findOneAndUpdate(
      { series, year },
      {
        $inc: { lastNumber: 1 },
        $set: { updatedAt: new Date() },
        $setOnInsert: { series, year },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    )

  if (!result) {
    throw new Error(
      `Failed to get invoice number for series: ${series}, year: ${year}`
    )
  }

  return result.lastNumber
}

/**
 * Get the current invoice counter for a specific series + year without
 * incrementing.
 */
export async function getCurrentInvoiceNumber(
  series: InvoiceSeries,
  year: number
): Promise<number> {
  const db = await getDatabase()

  const counter = await db
    .collection<InvoiceCounter>("invoiceCounters")
    .findOne({ series, year })

  return counter?.lastNumber || 0
}

/**
 * Initialize all invoice series for a given year with starting number
 * (for testing/setup).
 */
export async function initializeInvoiceCounters(
  year: number,
  startNumber = 0
): Promise<void> {
  const db = await getDatabase()
  const series: InvoiceSeries[] = [
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

  await db.collection<InvoiceCounter>("invoiceCounters").bulkWrite(operations)
}
