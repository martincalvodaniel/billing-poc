import { NextResponse } from "next/server"
import type { CompanyInfo } from "@/lib/domain/entities/companyInfo"
import type {
  InvoiceMetadata,
  InvoiceType,
  Payment,
} from "@/lib/domain/entities/payment"
import { REGULAR_INVOICE_TYPES } from "@/lib/domain/services/invoice-validator"
import { generateInvoicePdf, parseInvoiceId } from "@/lib/invoicePdf"
import { getClientById } from "@/lib/server-cache"

/**
 * Renders the PDF from unified invoice metadata. Returns a 404 NextResponse
 * when the entry cannot be served (missing or malformed id).
 */
export async function buildInvoicePdfResponse(
  entry: InvoiceMetadata,
  payment: Payment,
  company: CompanyInfo
): Promise<NextResponse> {
  if (!entry.id) {
    return NextResponse.json(
      { error: "Cannot regenerate invoice: missing id" },
      { status: 404 }
    )
  }
  const filename = `${entry.id}.pdf`

  const type: InvoiceType = entry.type
  const parsed = parseInvoiceId(entry.id)
  if (!parsed) {
    return NextResponse.json(
      { error: "Cannot regenerate invoice: malformed id" },
      { status: 404 }
    )
  }

  const client =
    REGULAR_INVOICE_TYPES.has(type) && payment.clientId
      ? await getClientById(payment.clientId)
      : null

  const pdf = await generateInvoicePdf({
    payment,
    client: client ?? undefined,
    series: parsed.type,
    invoiceNumber: parsed.n,
    company,
  })

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  })
}
