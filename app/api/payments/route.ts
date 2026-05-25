import { type NextRequest, NextResponse } from "next/server"
import { MongoPaymentRepository } from "@/lib/adapters/repositories/mongo-payment-repository"
import { requireAuth } from "@/lib/api-auth"
import { computePaymentFinancials } from "@/lib/domain/services/payment-calculator"
import {
  createPaymentSchema,
  deletePaymentSchema,
  paymentQuerySchema,
  updatePaymentSchema,
} from "@/lib/domain/services/payment-validator"
import { getClientById, getPaymentById } from "@/lib/server-cache"
import { zodError } from "@/lib/validation"

const payments = new MongoPaymentRepository()

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

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
    const denied = await requireAuth()
    if (denied) return denied

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
      discount,
      tag,
      clientId,
      deliveryNoteRef,
      paymentMethod,
    } = parsed.data
    const surchargeVal = surcharge ?? 0
    const discountVal = discount ?? 0

    // Verify client exists if provided
    if (clientId) {
      const client = await getClientById(clientId)
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
      }
    }

    const financials = computePaymentFinancials(
      concepts,
      vat,
      surchargeVal,
      discountVal
    )

    const id = await payments.create({
      type,
      date,
      tag: tag || undefined,
      clientId: clientId || undefined,
      deliveryNoteRef: deliveryNoteRef || undefined,
      paymentMethod: paymentMethod || undefined,
      concepts,
      vat,
      surcharge: surchargeVal > 0 ? surchargeVal : undefined,
      discount: discountVal > 0 ? discountVal : undefined,
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
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = updatePaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const { id, clientId, ...fields } = parsed.data

    const needsExisting =
      fields.concepts !== undefined ||
      fields.vat !== undefined ||
      fields.surcharge !== undefined ||
      fields.discount !== undefined ||
      fields.total !== undefined

    // Parallelize the two independent reads (client existence + existing payment)
    const [client, existing] = await Promise.all([
      clientId ? getClientById(clientId) : Promise.resolve(null),
      needsExisting ? getPaymentById(id) : Promise.resolve(null),
    ])

    if (clientId && !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Recalculate financials if concepts, vat, or surcharge changed
    const updateData: Record<string, unknown> = { ...fields }
    if (clientId !== undefined) updateData.clientId = clientId || undefined

    if (needsExisting) {
      if (!existing) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        )
      }

      const concepts = fields.concepts ?? existing.concepts
      const vat = fields.vat ?? existing.vat
      const surcharge = fields.surcharge ?? existing.surcharge ?? 0
      // When the client omits `discount`, preserve the stored value; otherwise
      // honour the submitted number (including 0, which means "no discount").
      const discountCandidate = fields.discount ?? existing.discount ?? 0
      const discount = Number.isFinite(discountCandidate)
        ? discountCandidate
        : 0
      const financials = computePaymentFinancials(
        concepts,
        vat,
        surcharge,
        discount
      )

      updateData.concepts = concepts
      updateData.vat = vat
      // Forward raw numbers (including 0) to the repository so it can decide
      // whether to `$set` or `$unset`. The response below still surfaces
      // `undefined` for 0 so client state stays in sync with persistence.
      updateData.surcharge = surcharge
      updateData.discount = discount
      updateData.total = financials.total
      updateData.netAmount = financials.netAmount
      updateData.vatAmount = financials.vatAmount
      updateData.surchargeAmount =
        surcharge > 0 ? financials.surchargeAmount : undefined
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
        surchargeAmount:
          typeof updateData.surcharge === "number" && updateData.surcharge > 0
            ? updateData.surchargeAmount
            : undefined,
        netAmount: updateData.netAmount,
        vat: updateData.vat,
        surcharge:
          typeof updateData.surcharge === "number" && updateData.surcharge > 0
            ? updateData.surcharge
            : undefined,
        discount:
          typeof updateData.discount === "number" && updateData.discount > 0
            ? updateData.discount
            : undefined,
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
    const denied = await requireAuth()
    if (denied) return denied

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
