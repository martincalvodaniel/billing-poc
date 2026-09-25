import type { InvoiceType } from "./payment"

export const NUMBERED_INVOICE_SERIES = [
  "Invoice",
  "SimpleInvoice",
  "RectificativeInvoice",
  "RectificativeSimpleInvoice",
] as const satisfies readonly InvoiceType[]

export type NumberedInvoiceSeries = (typeof NUMBERED_INVOICE_SERIES)[number]

export interface InvoiceCounter {
  _id?: string
  series: NumberedInvoiceSeries
  year: number
  lastNumber: number
  updatedAt: Date
}

export interface GeneratedInvoiceRecord {
  id: string
  series: NumberedInvoiceSeries
  year: number
  number: number
  generatedAt: Date
  paymentId: string
  paymentDate: string
  paymentTotal: number
  paymentDescription: string
}
