export type PaymentType = "income" | "outcome"

export const PAYMENT_METHODS = ["cash", "card", "bank_transfer"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank transfer",
}

export type InvoiceType =
  | "Invoice"
  | "RectificativeInvoice"
  | "SimpleInvoice"
  | "RectificativeSimpleInvoice"
  | "Receipt"

export interface PaymentConcept {
  productId?: string
  name: string
  amount: number
  quantity: number
}

/**
 * Unified invoice metadata entry. An entry has a `type` plus exactly one
 * of `id` (generated PDF) or `link` (external URL).
 */
export interface InvoiceMetadata {
  type: InvoiceType
  id?: string
  link?: string
  generatedAt: Date
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
  invoices?: InvoiceMetadata[]
  paymentMethod?: PaymentMethod
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
  paymentMethod?: PaymentMethod | ""
}

/**
 * Unifies the legacy `payment.invoice` single-field with the new
 * `payment.invoices` array. Legacy entry (if present) comes first, followed
 * by the array in stored order.
 */
export function getPaymentInvoices(payment: {
  invoice?: InvoiceMetadata
  invoices?: InvoiceMetadata[]
}): InvoiceMetadata[] {
  const legacy = payment.invoice ? [payment.invoice] : []
  const arr = payment.invoices ?? []
  return [...legacy, ...arr]
}
