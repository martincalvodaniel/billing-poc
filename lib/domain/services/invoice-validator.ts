import { z } from "zod"
import {
  type Payment as DomainPayment,
  getPaymentInvoices,
  type InvoiceType,
} from "../entities/payment"

export type { InvoiceType }

const objectIdPattern = /^[0-9a-fA-F]{24}$/

/** The four generated-PDF invoice types. */
const INVOICE_TYPE_VALUES = [
  "Invoice",
  "RectificativeInvoice",
  "SimpleInvoice",
  "RectificativeSimpleInvoice",
] as const satisfies readonly InvoiceType[]

export const generateInvoiceSchema = z.object({
  paymentId: z
    .string()
    .min(1, "paymentId is required")
    .regex(objectIdPattern, "paymentId must be a 24-character hex ObjectId"),
  type: z.enum(INVOICE_TYPE_VALUES),
  persist: z.boolean().optional(),
})

const SIMPLE_TYPES: InvoiceType[] = [
  "SimpleInvoice",
  "RectificativeSimpleInvoice",
]
const REGULAR_TYPES: InvoiceType[] = ["Invoice", "RectificativeInvoice"]

export const REGULAR_INVOICE_TYPES: ReadonlySet<InvoiceType> = new Set(
  REGULAR_TYPES
)

const RECTIFICATIVE_TO_BASE: Partial<Record<InvoiceType, InvoiceType>> = {
  RectificativeInvoice: "Invoice",
  RectificativeSimpleInvoice: "SimpleInvoice",
}

export type AssertCanGenerateResult =
  | { ok: true }
  | { ok: false; reason: string }

/**
 * Minimal shape needed to validate an invoice-generation request. Accepts
 * either the domain `Payment` or any subset that includes the relevant
 * fields — keeps the helper purely functional and DB-free.
 */
export interface InvoiceCandidatePayment {
  type: DomainPayment["type"]
  clientId?: string
  invoice?: DomainPayment["invoice"]
  invoices?: DomainPayment["invoices"]
}

function invoiceEntryType(
  entry: NonNullable<InvoiceCandidatePayment["invoice"]>
): InvoiceType {
  return entry.type
}

export function assertCanGenerateInvoice(
  payment: InvoiceCandidatePayment,
  type: InvoiceType
): AssertCanGenerateResult {
  if (type === "Receipt") {
    return {
      ok: false,
      reason: "Receipts cannot be generated as PDFs",
    }
  }
  if (payment.type !== "income") {
    return {
      ok: false,
      reason: "Invoices can only be generated for income payments",
    }
  }

  const existing = getPaymentInvoices(payment)
  const isSimple = SIMPLE_TYPES.includes(type)
  const isRectificative = type in RECTIFICATIVE_TO_BASE

  if (!isRectificative) {
    if (existing.some((i) => invoiceEntryType(i) === type)) {
      return {
        ok: false,
        reason: `An invoice of series ${type} has already been generated for this payment`,
      }
    }
  } else {
    const base = RECTIFICATIVE_TO_BASE[type]
    if (!base || !existing.some((i) => invoiceEntryType(i) === base)) {
      return {
        ok: false,
        reason: `Cannot generate ${type} without the corresponding ${base ?? "base"} invoice`,
      }
    }
  }

  if (!isSimple && REGULAR_TYPES.includes(type)) {
    if (!payment.clientId) {
      return {
        ok: false,
        reason: "Cannot generate this invoice without an associated client.",
      }
    }
  }

  return { ok: true }
}
