import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getPaymentInvoices } from "@/lib/domain/entities/payment"
import { buildInvoicePdfResponse } from "@/lib/invoicePdfResponse"
import { getCompanyInfo, getPaymentById } from "@/lib/server-cache"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      )
    }

    const payment = await getPaymentById(id)
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.type !== "income") {
      return NextResponse.json(
        { error: "No invoice found for this payment" },
        { status: 404 }
      )
    }

    const entries = getPaymentInvoices(payment)
    let last: (typeof entries)[number] | undefined
    for (let i = entries.length - 1; i >= 0; i--) {
      const candidate = entries[i]
      if (candidate.id) {
        last = candidate
        break
      }
    }
    if (!last) {
      return NextResponse.json(
        { error: "No invoice found for this payment" },
        { status: 404 }
      )
    }

    const company = await getCompanyInfo()
    return await buildInvoicePdfResponse(last, payment, company)
  } catch (error) {
    console.error(`Error retrieving invoice: ${error}`)
    return NextResponse.json(
      { error: "Failed to retrieve invoice" },
      { status: 500 }
    )
  }
}
