import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { MongoPaymentRepository } from "@/lib/adapters/repositories/mongo-payment-repository"
import { requireAuth } from "@/lib/api-auth"
import type { InvoiceMetadata } from "@/lib/types"
import { zodError } from "@/lib/validation"

const paymentRepo = new MongoPaymentRepository()

const bodySchema = z.object({
  type: z.enum(["Invoice", "Receipt"]),
  link: z.string().url().max(2048),
})

export async function POST(
  request: NextRequest,
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

    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }
    const { type, link } = parsed.data

    const payment = await paymentRepo.findById(id)
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.type === "income" && type !== "Receipt") {
      return NextResponse.json(
        {
          error:
            "Income payments can only attach Receipt links via this endpoint",
        },
        { status: 400 }
      )
    }

    // `Receipt` is now part of the `InvoiceType` union (Wave E). Generated
    // PDF rendering excludes it via a narrowed `GeneratedInvoiceType`.
    const entry: InvoiceMetadata = {
      type,
      link,
      generatedAt: new Date(),
    }

    const appended = await paymentRepo.appendInvoice(id, entry)
    if (!appended) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(`Error appending link invoice: ${error}`)
    return NextResponse.json(
      { error: "Failed to append link invoice" },
      { status: 500 }
    )
  }
}
