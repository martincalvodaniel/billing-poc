import type {
  InvoiceReductionFailureReason,
  InvoiceReductionPreview,
} from "@/lib/domain/services/invoice-administration"

export function invoiceReductionFailureStatus(
  reason: InvoiceReductionFailureReason
): number {
  if (reason === "counter-not-found") return 404
  if (reason === "not-a-reduction") return 400
  return 409
}

export function serializeInvoiceReductionPreview(
  preview: InvoiceReductionPreview
) {
  return {
    ...preview,
    invoices: preview.invoices.map((invoice) => ({
      ...invoice,
      generatedAt: invoice.generatedAt.toISOString(),
    })),
  }
}
