import type { InvoiceType } from "./payment"

export interface InvoiceCounter {
  _id?: string
  series: InvoiceType
  year: number
  lastNumber: number
  updatedAt: Date
}
