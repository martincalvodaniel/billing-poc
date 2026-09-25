import "server-only"

import type { PaymentMethod } from "@/lib/domain/entities/payment"

export {
  formatInvoiceNumber,
  parseInvoiceId,
} from "@/lib/domain/services/invoice-numbering"

import type { GeneratedInvoiceType } from "./invoicePdf-layout"

export function formatInvoiceDateES(date: string | Date): string {
  let d: Date
  if (typeof date === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
    if (match) {
      d = new Date(
        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      )
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d)
}

const PAYMENT_METHOD_LABEL_ES: Record<PaymentMethod, string> = {
  cash: "Pago en efectivo",
  card: "Pago con tarjeta bancaria",
  bank_transfer: "Pago por transferencia",
}

export function paymentMethodLabelES(
  method: PaymentMethod | undefined
): string {
  if (!method) return ""
  return PAYMENT_METHOD_LABEL_ES[method] ?? ""
}

export function formatInvoiceAmount(n: number): string {
  return `${n.toFixed(2).replace(".", ",")}€`
}

export function invoiceTitle(series: GeneratedInvoiceType): string[] {
  switch (series) {
    case "Invoice":
      return ["FACTURA"]
    case "SimpleInvoice":
      return ["FACTURA SIMPLIFICADA"]
    case "RectificativeInvoice":
      return ["FACTURA", "RECTIFICATIVA"]
    case "RectificativeSimpleInvoice":
      return ["FACTURA SIMPLIFICADA", "RECTIFICATIVA"]
  }
}

export function isSimpleSeries(series: GeneratedInvoiceType): boolean {
  return series === "SimpleInvoice" || series === "RectificativeSimpleInvoice"
}
