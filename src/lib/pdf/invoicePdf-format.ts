import "server-only"

import type { PaymentMethod } from "@/lib/domain/entities/payment"
import type { GeneratedInvoiceType } from "./invoicePdf-layout"

const SERIES_PREFIX: Record<GeneratedInvoiceType, string> = {
  Invoice: "F",
  SimpleInvoice: "FS",
  RectificativeInvoice: "FR",
  RectificativeSimpleInvoice: "FSR",
}

const PREFIX_TO_TYPE: Record<string, GeneratedInvoiceType> = {
  FSR: "RectificativeSimpleInvoice",
  FS: "SimpleInvoice",
  FR: "RectificativeInvoice",
  F: "Invoice",
}

export function formatInvoiceNumber(
  series: GeneratedInvoiceType,
  year: number,
  n: number
): string {
  const yy = String(year % 100).padStart(2, "0")
  const nnn = String(n).padStart(3, "0")
  return `${SERIES_PREFIX[series]}${yy}_${nnn}`
}

export function parseInvoiceId(
  id: string
): { type: GeneratedInvoiceType; year: number; n: number } | null {
  const match = /^(FSR|FS|FR|F)(\d{2})_(\d{3,})$/.exec(id)
  if (!match) return null
  const prefix = match[1]
  const type = PREFIX_TO_TYPE[prefix]
  if (!type) return null
  const yy = Number.parseInt(match[2], 10)
  const n = Number.parseInt(match[3], 10)
  if (!Number.isFinite(yy) || !Number.isFinite(n) || n <= 0) return null
  return { type, year: 2000 + yy, n }
}

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
