import { getDatabase } from "./mongodb";
import { InvoiceCounter, InvoiceSeries } from "./types";

/**
 * Get and increment the invoice counter for a specific series
 * Returns the next sequential number for the series
 */
export async function getNextInvoiceNumber(series: InvoiceSeries): Promise<number> {
  const db = await getDatabase();
  
  // Use findOneAndUpdate with upsert to atomically get and increment
  const result = await db.collection<InvoiceCounter>("invoiceCounters").findOneAndUpdate(
    { series },
    {
      $inc: { lastNumber: 1 },
      $set: { updatedAt: new Date() },
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  if (!result) {
    throw new Error(`Failed to get invoice number for series: ${series}`);
  }

  return result.lastNumber;
}

/**
 * Get the current invoice counter for a specific series without incrementing
 */
export async function getCurrentInvoiceNumber(series: InvoiceSeries): Promise<number> {
  const db = await getDatabase();
  
  const counter = await db.collection<InvoiceCounter>("invoiceCounters").findOne({ series });
  
  return counter?.lastNumber || 0;
}

/**
 * Initialize all invoice series with starting number (for testing/setup)
 */
export async function initializeInvoiceCounters(startNumber = 0): Promise<void> {
  const db = await getDatabase();
  const series: InvoiceSeries[] = ["Invoice", "RectificativeInvoice", "SimpleInvoice", "RectificativeSimpleInvoice"];
  
  const operations = series.map((s) => ({
    updateOne: {
      filter: { series: s },
      update: {
        $setOnInsert: { series: s, lastNumber: startNumber, updatedAt: new Date() },
      },
      upsert: true,
    },
  }));

  await db.collection<InvoiceCounter>("invoiceCounters").bulkWrite(operations);
}
