import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { getClientById, getPaymentById } from "@/lib/db/cache"
import { MongoPaymentRepository } from "@/lib/db/repositories/mongo-payment-repository"
import { computePaymentFinancials } from "@/lib/domain/services/payment-calculator"
import { zodError } from "@/lib/utils/validation"
import { updatePaymentSchema } from "@/schemas/payment-validator"

const payments = new MongoPaymentRepository()

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

    const [client, existing] = await Promise.all([
      clientId ? getClientById(clientId) : Promise.resolve(null),
      needsExisting ? getPaymentById(id) : Promise.resolve(null),
    ])

    if (clientId && !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

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
      updateData.surcharge = surcharge
      updateData.discount = discount
      updateData.total = financials.total
      updateData.netAmount = financials.netAmount
      updateData.vatAmount = financials.vatAmount
      updateData.surchargeAmount =
        surcharge !== 0 ? financials.surchargeAmount : undefined
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
          typeof updateData.surcharge === "number" && updateData.surcharge !== 0
            ? updateData.surchargeAmount
            : undefined,
        netAmount: updateData.netAmount,
        vat: updateData.vat,
        surcharge:
          typeof updateData.surcharge === "number" && updateData.surcharge !== 0
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
