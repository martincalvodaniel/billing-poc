import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoPaymentRepository } from "@/lib/db/repositories/mongo-payment-repository"
import type { InvoiceMetadata } from "@/lib/domain/entities/payment"
import { zodError } from "@/lib/utils/validation"

const paymentRepo = new MongoPaymentRepository()

const bodySchema = z.object({
  type: z.enum(["Invoice", "Receipt"]),
  link: z.string().url().max(2048),
})

const deleteBodySchema = z.object({
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

export async function DELETE(
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
    const parsed = deleteBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }
    const { link } = parsed.data

    const removed = await paymentRepo.removeLinkInvoice(id, link)
    if (!removed) {
      return NextResponse.json(
        { error: "Link entry not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(`Error removing link invoice: ${error}`)
    return NextResponse.json(
      { error: "Failed to remove link invoice" },
      { status: 500 }
    )
  }
}
