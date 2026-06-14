import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoPaymentTemplateRepository } from "@/lib/db/repositories/mongo-payment-template-repository"
import { zodError } from "@/lib/utils/validation"
import { createPaymentTemplateSchema } from "@/schemas/payment-template-validator"

const paymentTemplates = new MongoPaymentTemplateRepository()

export async function GET(_request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const paymentTemplatesList = await paymentTemplates.findAll()
    return NextResponse.json(
      { paymentTemplates: paymentTemplatesList },
      { status: 200 }
    )
  } catch (error) {
    console.error(`Error fetching payment templates: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch payment templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = createPaymentTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const id = await paymentTemplates.create({
      name: parsed.data.name,
      type: parsed.data.type,
      concepts: parsed.data.concepts,
      vat: parsed.data.vat,
      surcharge:
        parsed.data.surcharge !== 0 ? parsed.data.surcharge : undefined,
      discount: parsed.data.discount !== 0 ? parsed.data.discount : undefined,
      tag: parsed.data.tag,
      clientId: parsed.data.clientId,
      deliveryNoteRef: parsed.data.deliveryNoteRef,
      paymentMethod: parsed.data.paymentMethod,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error(`Error creating payment template: ${error}`)
    return NextResponse.json(
      { error: "Failed to create payment template" },
      { status: 500 }
    )
  }
}
