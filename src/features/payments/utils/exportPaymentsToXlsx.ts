import {
  getPaymentInvoices,
  PAYMENT_METHOD_LABELS,
  type Payment,
} from "@/lib/domain/entities/payment"
import { calculateTotal } from "@/lib/domain/services/payment-calculator"

export const PAYMENTS_EXPORT_HEADERS = [
  "Date",
  "Type",
  "Client",
  "Payment Method",
  "Concepts",
  "Concept Subtotal",
  "Discount",
  "Net Amount",
  "VAT Rate (%)",
  "VAT Amount",
  "Surcharge Rate (%)",
  "Surcharge Amount",
  "Total",
  "Invoices",
] as const

type PaymentExportHeader = (typeof PAYMENTS_EXPORT_HEADERS)[number]

export type PaymentExportRow = {
  [Header in PaymentExportHeader]: string | number
}

const COLUMN_WIDTHS: Record<PaymentExportHeader, number> = {
  Date: 12,
  Type: 10,
  Client: 24,
  "Payment Method": 18,
  Concepts: 48,
  "Concept Subtotal": 18,
  Discount: 14,
  "Net Amount": 16,
  "VAT Rate (%)": 14,
  "VAT Amount": 16,
  "Surcharge Rate (%)": 20,
  "Surcharge Amount": 20,
  Total: 16,
  Invoices: 36,
}

const MONEY_HEADERS = [
  "Concept Subtotal",
  "Discount",
  "Net Amount",
  "VAT Amount",
  "Surcharge Amount",
  "Total",
] as const satisfies readonly PaymentExportHeader[]

function formatConcepts(payment: Payment): string {
  return payment.concepts
    .map((concept) => {
      const quantity = concept.quantity || 1
      return `${concept.name} (${quantity} x ${concept.amount.toFixed(2)} EUR)`
    })
    .join(" | ")
}

function formatInvoices(payment: Payment): string {
  return getPaymentInvoices(payment)
    .map((invoice) => {
      const reference = invoice.id ?? invoice.link
      return reference ? `${invoice.type}: ${reference}` : invoice.type
    })
    .join(" | ")
}

export function buildPaymentsExportFilename(
  year: number,
  month: number
): string {
  return `${year}${String(month).padStart(2, "0")}.xlsx`
}

export function buildPaymentsExportRows(
  payments: Payment[],
  clientNameById: ReadonlyMap<string, string>
): PaymentExportRow[] {
  return payments.map((payment) => ({
    Date: payment.date,
    Type: payment.type === "income" ? "Income" : "Outcome",
    Client: payment.clientId
      ? (clientNameById.get(payment.clientId) ?? "Unknown client")
      : "",
    "Payment Method": payment.paymentMethod
      ? PAYMENT_METHOD_LABELS[payment.paymentMethod]
      : "",
    Concepts: formatConcepts(payment),
    "Concept Subtotal": calculateTotal(payment.concepts),
    Discount: payment.discount ?? 0,
    "Net Amount": payment.netAmount,
    "VAT Rate (%)": payment.vat,
    "VAT Amount": payment.vatAmount,
    "Surcharge Rate (%)": payment.surcharge ?? 0,
    "Surcharge Amount": payment.surchargeAmount ?? 0,
    Total: payment.total,
    Invoices: formatInvoices(payment),
  }))
}

interface ExportPaymentsToXlsxArgs {
  payments: Payment[]
  clientNameById: ReadonlyMap<string, string>
  year: number
  month: number
}

export async function exportPaymentsToXlsx({
  payments,
  clientNameById,
  year,
  month,
}: ExportPaymentsToXlsxArgs): Promise<void> {
  const xlsx = await import("xlsx")
  const rows = buildPaymentsExportRows(payments, clientNameById)
  const worksheet = xlsx.utils.json_to_sheet(rows, {
    header: [...PAYMENTS_EXPORT_HEADERS],
  })

  worksheet["!cols"] = PAYMENTS_EXPORT_HEADERS.map((header) => ({
    wch: COLUMN_WIDTHS[header],
  }))
  worksheet["!autofilter"] = {
    ref: `A1:${xlsx.utils.encode_col(PAYMENTS_EXPORT_HEADERS.length - 1)}${rows.length + 1}`,
  }

  for (const header of MONEY_HEADERS) {
    const columnIndex = PAYMENTS_EXPORT_HEADERS.indexOf(header)
    for (let rowIndex = 1; rowIndex <= rows.length; rowIndex += 1) {
      const cell =
        worksheet[xlsx.utils.encode_cell({ c: columnIndex, r: rowIndex })]
      if (cell) cell.z = "€ #,##0.00;[Red]-€ #,##0.00"
    }
  }

  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, worksheet, "Payments")
  xlsx.writeFileXLSX(workbook, buildPaymentsExportFilename(year, month), {
    compression: true,
  })
}
