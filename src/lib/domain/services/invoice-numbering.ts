import {
  type GeneratedInvoiceRecord,
  NUMBERED_INVOICE_SERIES,
  type NumberedInvoiceSeries,
} from "../entities/invoice"
import { getPaymentInvoices, type Payment } from "../entities/payment"

const SERIES_PREFIX: Record<NumberedInvoiceSeries, string> = {
  Invoice: "F",
  SimpleInvoice: "FS",
  RectificativeInvoice: "FR",
  RectificativeSimpleInvoice: "FSR",
}

const PREFIX_TO_SERIES: Record<string, NumberedInvoiceSeries> = {
  FSR: "RectificativeSimpleInvoice",
  FS: "SimpleInvoice",
  FR: "RectificativeInvoice",
  F: "Invoice",
}

const SERIES_ORDER = new Map(
  NUMBERED_INVOICE_SERIES.map((series, index) => [series, index])
)

export function getInvoiceSeriesPrefix(series: NumberedInvoiceSeries): string {
  return SERIES_PREFIX[series]
}

export function formatInvoiceNumber(
  series: NumberedInvoiceSeries,
  year: number,
  number: number
): string {
  const shortYear = String(year % 100).padStart(2, "0")
  const paddedNumber = String(number).padStart(3, "0")
  return `${SERIES_PREFIX[series]}${shortYear}_${paddedNumber}`
}

export function parseInvoiceId(
  id: string
): { type: NumberedInvoiceSeries; year: number; n: number } | null {
  const match = /^(FSR|FS|FR|F)(\d{2})_(\d{3,})$/.exec(id)
  if (!match) return null
  const type = PREFIX_TO_SERIES[match[1]]
  if (!type) return null
  const shortYear = Number.parseInt(match[2], 10)
  const number = Number.parseInt(match[3], 10)
  if (!Number.isFinite(shortYear) || !Number.isFinite(number) || number <= 0) {
    return null
  }
  return { type, year: 2000 + shortYear, n: number }
}

function describePayment(payment: Payment): string {
  const names = payment.concepts
    .map((concept) => concept.name.trim())
    .filter((name) => name.length > 0)
  return names.length > 0 ? names.join(", ") : "Payment"
}

export function collectGeneratedInvoices(
  payments: Payment[]
): GeneratedInvoiceRecord[] {
  const records: GeneratedInvoiceRecord[] = []

  for (const payment of payments) {
    if (!payment._id) continue
    for (const invoice of getPaymentInvoices(payment)) {
      if (!invoice.id) continue
      const parsed = parseInvoiceId(invoice.id)
      if (!parsed) continue
      records.push({
        id: invoice.id,
        series: parsed.type,
        year: parsed.year,
        number: parsed.n,
        generatedAt: invoice.generatedAt,
        paymentId: payment._id,
        paymentDate: payment.date,
        paymentTotal: payment.total,
        paymentDescription: describePayment(payment),
      })
    }
  }

  return records.sort((left, right) => {
    if (left.year !== right.year) return right.year - left.year
    const seriesDifference =
      (SERIES_ORDER.get(left.series) ?? 0) -
      (SERIES_ORDER.get(right.series) ?? 0)
    if (seriesDifference !== 0) return seriesDifference
    return right.number - left.number
  })
}

export function getInvoicesRemovedByReduction(
  invoices: GeneratedInvoiceRecord[],
  series: NumberedInvoiceSeries,
  year: number,
  newLastNumber: number
): GeneratedInvoiceRecord[] {
  return invoices.filter(
    (invoice) =>
      invoice.series === series &&
      invoice.year === year &&
      invoice.number > newLastNumber
  )
}

export function countAffectedPayments(
  invoices: GeneratedInvoiceRecord[]
): number {
  return new Set(invoices.map((invoice) => invoice.paymentId)).size
}
