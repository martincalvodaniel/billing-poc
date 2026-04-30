import { get } from "@vercel/blob"
import { ObjectId } from "mongodb"
import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Payment } from "@/lib/types"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Fetch payment
    const payment = await db.collection<Payment>("payments").findOne({
      _id: new ObjectId(id),
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Resolve which blob URL to stream
    let blobUrl: string | undefined
    let filename = "document.pdf"

    if (payment.type === "income" && payment.invoice) {
      blobUrl = payment.invoice.blobUrl
      filename = `${payment.invoice.series}-${String(payment.invoice.number).padStart(6, "0")}.pdf`
    } else if (payment.type === "outcome" && payment.providerBillUrl) {
      blobUrl = payment.providerBillUrl
      filename = "provider-bill.pdf"
    }

    if (!blobUrl) {
      return NextResponse.json(
        { error: "No invoice or provider bill found for this payment" },
        { status: 404 }
      )
    }

    // Fetch private blob using server-side token and stream to client
    const result = await get(blobUrl, { access: "private" })

    if (!result || result.statusCode !== 200) {
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
  } catch (error) {
    console.error(`Error retrieving invoice: ${error}`)
    return NextResponse.json(
      { error: "Failed to retrieve invoice" },
      { status: 500 }
    )
  }
}
