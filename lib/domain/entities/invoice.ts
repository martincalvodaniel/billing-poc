import type { InvoiceSeries } from "./payment"

export interface InvoiceCounter {
  _id?: string
  series: InvoiceSeries
  lastNumber: number
  updatedAt: Date
}
