import type { InvoiceSeries } from "./payment"

export interface InvoiceCounter {
  _id?: string
  series: InvoiceSeries
  year: number
  lastNumber: number
  updatedAt: Date
}
