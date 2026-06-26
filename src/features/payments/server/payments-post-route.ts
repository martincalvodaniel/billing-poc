import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { getClientById } from "@/lib/db/cache"
import { MongoPaymentRepository } from "@/lib/db/repositories/mongo-payment-repository"
import { computePaymentFinancials } from "@/lib/domain/services/payment-calculator"
import { zodError } from "@/lib/utils/validation"
import { createPaymentSchema } from "@/schemas/payment-validator"
import {
  isProductSaleTag,
  reserveProductStockForSale,
  rollbackProductStockChanges,
} from "./payment-stock-reservation"

const payments = new MongoPaymentRepository()

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

    let stockReservation:
      | Awaited<ReturnType<typeof reserveProductStockForSale>>
      | undefined
    if (isProductSaleTag(tag)) {
      stockReservation = await reserveProductStockForSale(concepts)
      if (!stockReservation.success) {
        return NextResponse.json(
          { error: stockReservation.error },
          { status: 400 }
        )
      }
    }

    try {
      const id = await payments.create({
        type,
        date,
        tag: tag || undefined,
        clientId: clientId || undefined,
        deliveryNoteRef: deliveryNoteRef || undefined,
        paymentMethod: paymentMethod || undefined,
        concepts,
        vat,
        surcharge: surchargeVal !== 0 ? surchargeVal : undefined,
        discount: discountVal > 0 ? discountVal : undefined,
        ...financials,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      return NextResponse.json({ success: true, id }, { status: 201 })
    } catch (error) {
      if (stockReservation?.success) {
        await rollbackProductStockChanges(stockReservation.changes)
      }
      throw error
    }
  } catch (error) {
    console.error(`Error creating payment: ${error}`)
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    )
  }
}
