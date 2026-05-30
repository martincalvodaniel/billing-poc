import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { MongoPaymentRepository } from "@/lib/adapters/repositories/mongo-payment-repository"
import { requireAuth } from "@/lib/api-auth"
import { zodError } from "@/lib/validation"

const payments = new MongoPaymentRepository()

const bodySchema = z.object({
  url: z.string().url().max(2048).nullable(),
})

export async function PUT(
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

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const updated = await payments.setProviderBillLink(id, parsed.data.url)
    if (!updated) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json(
      { success: true, providerBillLink: parsed.data.url },
      { status: 200 }
    )
  } catch (error) {
    console.error(`Error updating provider bill link: ${error}`)
    return NextResponse.json(
      { error: "Failed to update provider bill link" },
      { status: 500 }
    )
  }
}
