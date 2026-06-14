import type {
  InvoiceMetadata,
  InvoiceType,
} from "@/lib/domain/entities/payment"

export interface InvoiceButtonAction {
  label: string
  series: InvoiceType
  rectificative: boolean
}

export interface InvoiceButtonState {
  primary: InvoiceButtonAction
  simple: InvoiceButtonAction
}

const TYPE_LABEL: Record<InvoiceType, string> = {
  Invoice: "Invoice",
  RectificativeInvoice: "Rectificative Invoice",
  SimpleInvoice: "Simple Invoice",
  RectificativeSimpleInvoice: "Rectificative Simple Invoice",
  Receipt: "Receipt",
}

export function typeLabel(type: InvoiceType): string {
  return TYPE_LABEL[type]
}

export function invoiceButtonState(
  invoices: InvoiceMetadata[]
): InvoiceButtonState {
  const hasInvoice = invoices.some((i) => i.type === "Invoice")
  const hasSimple = invoices.some((i) => i.type === "SimpleInvoice")
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
