import { type NextRequest, NextResponse } from "next/server"
import { MongoClientRepository } from "@/lib/adapters/repositories/mongo-client-repository"
import { MongoPaymentRepository } from "@/lib/adapters/repositories/mongo-payment-repository"
import { computePaymentFinancials } from "@/lib/domain/services/payment-calculator"
import {
  createPaymentSchema,
  deletePaymentSchema,
  paymentQuerySchema,
  updatePaymentSchema,
} from "@/lib/domain/services/payment-validator"
import { zodError } from "@/lib/validation"

const payments = new MongoPaymentRepository()
const clients = new MongoClientRepository()

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = paymentQuerySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const result = await payments.findAll({
      year: parsed.data.year,
      month: parsed.data.month,
    })

    console.log(
      `Fetched ${result.length} payments for filter: ${JSON.stringify(parsed.data)}`
    )
    return NextResponse.json({ payments: result }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching payments: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const {
      type,
      date,
      concepts,
      vat,
      surcharge,
      tag,
      clientId,
      deliveryNoteRef,
    } = parsed.data
    const surchargeVal = surcharge ?? 0

    // Verify client exists if provided
    if (clientId) {
      const client = await clients.findById(clientId)
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
      }
    }

    const financials = computePaymentFinancials(concepts, vat, surchargeVal)

    const id = await payments.create({
      type,
      date,
      tag: tag || undefined,
      clientId: clientId || undefined,
      deliveryNoteRef: deliveryNoteRef || undefined,
      concepts,
      vat,
      surcharge: surchargeVal > 0 ? surchargeVal : undefined,
      ...financials,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error(`Error creating payment: ${error}`)
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updatePaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const { id, clientId, ...fields } = parsed.data

    // Verify client if provided
    if (clientId) {
      const client = await clients.findById(clientId)
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
      }
    }

    // Recalculate financials if concepts, vat, or surcharge changed
    const updateData: Record<string, unknown> = { ...fields }
    if (clientId !== undefined) updateData.clientId = clientId || undefined

    if (
      fields.concepts !== undefined ||
      fields.vat !== undefined ||
      fields.surcharge !== undefined ||
      fields.total !== undefined
    ) {
      const existing = await payments.findById(id)
      if (!existing) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        )
      }

      const concepts = fields.concepts ?? existing.concepts
      const vat = fields.vat ?? existing.vat
      const surcharge = fields.surcharge ?? existing.surcharge ?? 0
      const financials = computePaymentFinancials(concepts, vat, surcharge)

      updateData.concepts = concepts
      updateData.vat = vat
      updateData.surcharge = surcharge > 0 ? surcharge : undefined
      updateData.total = financials.total
      updateData.netAmount = financials.netAmount
      updateData.vatAmount = financials.vatAmount
      updateData.surchargeAmount = financials.surchargeAmount
    }

    const updated = await payments.update(id, updateData)
    if (!updated) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        total: updateData.total,
        vatAmount: updateData.vatAmount,
        surchargeAmount: updateData.surchargeAmount,
        netAmount: updateData.netAmount,
        vat: updateData.vat,
        surcharge: updateData.surcharge,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`Error updating payment: ${error}`)
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = deletePaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const deleted = await payments.delete(parsed.data.id)
    if (!deleted) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting payment: ${error}`)
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    )
  }
}
