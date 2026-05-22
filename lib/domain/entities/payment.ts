export type PaymentType = "income" | "outcome"

export type InvoiceSeries =
  | "Invoice"
  | "RectificativeInvoice"
  | "SimpleInvoice"
  | "RectificativeSimpleInvoice"

export interface PaymentConcept {
  name: string
  amount: number
  quantity: number
}

export interface InvoiceMetadata {
  series: InvoiceSeries
  number: number
  generatedAt: Date
  blobUrl: string
  blobPathname: string
}

export interface Payment {
  _id?: string
  type: PaymentType
  date: string
  tag?: string
  clientId?: string
  concepts: PaymentConcept[]
  vat: number
  surcharge?: number
  discount?: number
  deliveryNoteRef?: string
  netAmount: number
  vatAmount: number
  surchargeAmount?: number
  total: number
  invoice?: InvoiceMetadata
  providerBillUrl?: string
  providerBillPathname?: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentFormData {
  type: PaymentType
  date: string
  concepts: PaymentConcept[]
  vat: string
  surcharge?: string
  discount?: string
  tag?: string
  clientId?: string
  deliveryNoteRef?: string
}
