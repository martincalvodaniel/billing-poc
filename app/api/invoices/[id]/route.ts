import { get } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { REGULAR_INVOICE_SERIES } from "@/lib/domain/services/invoice-validator"
import { generateInvoicePdf } from "@/lib/invoicePdf"
import {
  getClientById,
  getCompanyInfo,
  getPaymentById,
} from "@/lib/server-cache"

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

    if (payment.type === "income") {
      const last =
        payment.invoices && payment.invoices.length > 0
          ? payment.invoices[payment.invoices.length - 1]
          : payment.invoice
      if (!last) {
        return NextResponse.json(
          { error: "No invoice found for this payment" },
          { status: 404 }
        )
      }

      const filename = `${last.formattedNumber}.pdf`

      if (last.blobUrl) {
        const result = await get(last.blobUrl, { access: "private" })
        if (result?.statusCode !== 200) {
          return NextResponse.json(
            { error: "Failed to retrieve file from storage" },
            { status: 404 }
          )
        }
        return new NextResponse(result.stream, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
          },
        })
      }

      const [company, client] = await Promise.all([
        getCompanyInfo(),
        REGULAR_INVOICE_SERIES.has(last.series) && payment.clientId
          ? getClientById(payment.clientId)
          : Promise.resolve(null),
      ])

      const pdf = await generateInvoicePdf({
        payment,
        client: client ?? undefined,
        series: last.series,
        invoiceNumber: last.number,
        company,
      })

      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
        },
      })
    }

    if (payment.providerBillLink) {
      return NextResponse.redirect(new URL(payment.providerBillLink), 302)
    }

    if (payment.providerBillUrl) {
      const result = await get(payment.providerBillUrl, { access: "private" })
      if (result?.statusCode !== 200) {
        return NextResponse.json(
          { error: "Failed to retrieve file from storage" },
          { status: 404 }
        )
      }
      return new NextResponse(result.stream, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="provider-bill.pdf"`,
        },
      })
    }

    return NextResponse.json(
      { error: "No invoice or provider bill found for this payment" },
      { status: 404 }
    )
  } catch (error) {
    console.error(`Error retrieving invoice: ${error}`)
    return NextResponse.json(
      { error: "Failed to retrieve invoice" },
      { status: 500 }
    )
  }
}
