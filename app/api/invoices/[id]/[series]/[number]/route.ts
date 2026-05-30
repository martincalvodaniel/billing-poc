import { get } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import {
  getPaymentInvoices,
  type InvoiceSeries,
} from "@/lib/domain/entities/payment"
import { getPaymentById } from "@/lib/server-cache"

const VALID_SERIES = new Set<InvoiceSeries>([
  "Invoice",
  "RectificativeInvoice",
  "SimpleInvoice",
  "RectificativeSimpleInvoice",
])

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; series: string; number: string }>
  }
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const { id, series, number } = await params
    if (!id || !series || !number) {
      return NextResponse.json(
        { error: "Missing path parameter" },
        { status: 400 }
      )
    }
    if (!VALID_SERIES.has(series as InvoiceSeries)) {
      return NextResponse.json(
        { error: "Invalid invoice series" },
        { status: 400 }
      )
    }
    const parsedNumber = Number.parseInt(number, 10)
    if (!Number.isFinite(parsedNumber) || parsedNumber <= 0) {
      return NextResponse.json(
        { error: "Invalid invoice number" },
        { status: 400 }
      )
    }

    const payment = await getPaymentById(id)
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const invoice = getPaymentInvoices(payment).find(
      (i) => i.series === series && i.number === parsedNumber
    )
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const result = await get(invoice.blobUrl, { access: "private" })
    if (result?.statusCode !== 200) {
      return NextResponse.json(
        { error: "Failed to retrieve file from storage" },
        { status: 404 }
      )
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.formattedNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error(`Error retrieving invoice: ${error}`)
    return NextResponse.json(
      { error: "Failed to retrieve invoice" },
      { status: 500 }
    )
  }
}
