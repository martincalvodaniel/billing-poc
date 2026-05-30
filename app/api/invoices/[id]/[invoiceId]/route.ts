import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getPaymentInvoices } from "@/lib/domain/entities/payment"
import { buildInvoicePdfResponse } from "@/lib/invoicePdfResponse"
import { getCompanyInfo, getPaymentById } from "@/lib/server-cache"

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; invoiceId: string }>
  }
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const { id: paymentId, invoiceId: rawInvoiceId } = await params
    if (!paymentId || !rawInvoiceId) {
      return NextResponse.json(
        { error: "Missing path parameter" },
        { status: 400 }
      )
    }
    const invoiceId = decodeURIComponent(rawInvoiceId)

    const payment = await getPaymentById(paymentId)
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const entry = getPaymentInvoices(payment).find(
      (i) => i.id !== "" && i.id === invoiceId
    )
    if (!entry?.id) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const company = await getCompanyInfo()
    return await buildInvoicePdfResponse(entry, payment, company)
  } catch (error) {
    console.error(`Error retrieving invoice: ${error}`)
    return NextResponse.json(
      { error: "Failed to retrieve invoice" },
      { status: 500 }
    )
  }
}
