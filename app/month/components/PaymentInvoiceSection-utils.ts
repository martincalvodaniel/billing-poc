import type { InvoiceMetadata, InvoiceSeries } from "@/lib/types"

export interface InvoiceButtonAction {
  label: string
  series: InvoiceSeries
  rectificative: boolean
}

export interface InvoiceButtonState {
  primary: InvoiceButtonAction
  simple: InvoiceButtonAction
}

const SERIES_LABEL: Record<InvoiceSeries, string> = {
  Invoice: "Invoice",
  RectificativeInvoice: "Rectificative Invoice",
  SimpleInvoice: "Simple Invoice",
  RectificativeSimpleInvoice: "Rectificative Simple Invoice",
}

export function seriesLabel(series: InvoiceSeries): string {
  return SERIES_LABEL[series]
}

export function invoiceButtonState(
  invoices: InvoiceMetadata[]
): InvoiceButtonState {
  const hasInvoice = invoices.some((i) => i.series === "Invoice")
  const hasSimple = invoices.some((i) => i.series === "SimpleInvoice")
  return {
    primary: {
      label: hasInvoice ? "Rectificative Invoice" : "Invoice",
      series: hasInvoice ? "RectificativeInvoice" : "Invoice",
      rectificative: hasInvoice,
    },
    simple: {
      label: hasSimple ? "Rectificative Simple Invoice" : "Simple Invoice",
      series: hasSimple ? "RectificativeSimpleInvoice" : "SimpleInvoice",
      rectificative: hasSimple,
    },
  }
}
