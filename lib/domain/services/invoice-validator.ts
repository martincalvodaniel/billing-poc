import { z } from "zod"
import {
  type Payment as DomainPayment,
  getPaymentInvoices,
  type InvoiceSeries,
} from "../entities/payment"

const objectIdPattern = /^[0-9a-fA-F]{24}$/

export const INVOICE_SERIES_VALUES: InvoiceSeries[] = [
  "Invoice",
  "RectificativeInvoice",
  "SimpleInvoice",
  "RectificativeSimpleInvoice",
]

export const generateInvoiceSchema = z.object({
  paymentId: z
    .string()
    .min(1, "paymentId is required")
    .regex(objectIdPattern, "paymentId must be a 24-character hex ObjectId"),
  series: z.enum([
    "Invoice",
    "RectificativeInvoice",
    "SimpleInvoice",
    "RectificativeSimpleInvoice",
  ]),
})

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>

const SIMPLE_SERIES: InvoiceSeries[] = [
  "SimpleInvoice",
  "RectificativeSimpleInvoice",
]
const REGULAR_SERIES: InvoiceSeries[] = ["Invoice", "RectificativeInvoice"]
const RECTIFICATIVE_TO_BASE: Partial<Record<InvoiceSeries, InvoiceSeries>> = {
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

export function assertCanGenerateInvoice(
  payment: InvoiceCandidatePayment,
  series: InvoiceSeries
): AssertCanGenerateResult {
  if (payment.type !== "income") {
    return {
      ok: false,
      reason: "Invoices can only be generated for income payments",
    }
  }

  const existing = getPaymentInvoices(payment)
  const isSimple = SIMPLE_SERIES.includes(series)
  const isRectificative = series in RECTIFICATIVE_TO_BASE

  if (!isRectificative) {
    if (existing.some((i) => i.series === series)) {
      return {
        ok: false,
        reason: `An invoice of series ${series} has already been generated for this payment`,
      }
    }
  } else {
    const base = RECTIFICATIVE_TO_BASE[series]
    if (!base || !existing.some((i) => i.series === base)) {
      return {
        ok: false,
        reason: `Cannot generate ${series} without the corresponding ${base ?? "base"} invoice`,
      }
    }
  }

  if (!isSimple && REGULAR_SERIES.includes(series)) {
    if (!payment.clientId) {
      return {
        ok: false,
        reason: "Cannot generate this invoice without an associated client.",
      }
    }
  }

  return { ok: true }
}
