import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { getClientById, getPaymentById } from "@/lib/db/cache"
import { MongoEventRepository } from "@/lib/db/repositories/mongo-event-repository"
import { MongoPaymentRepository } from "@/lib/db/repositories/mongo-payment-repository"
import { MongoProductRepository } from "@/lib/db/repositories/mongo-product-repository"
import { unlinkPaymentFromEvents } from "@/lib/domain/services/event-payment-service"
import { computePaymentFinancials } from "@/lib/domain/services/payment-calculator"
import { zodError } from "@/lib/utils/validation"
import {
  createPaymentSchema,
  deletePaymentSchema,
  paymentQuerySchema,
  updatePaymentSchema,
} from "@/schemas/payment-validator"

const payments = new MongoPaymentRepository()
const events = new MongoEventRepository()
const products = new MongoProductRepository()
type SaleTag = "LocalSale" | "MarketSale"

interface ProductSaleConcept {
  productId?: string
  name: string
  quantity: number
}

function isProductSaleTag(tag: string | undefined): tag is SaleTag {
  return tag === "LocalSale" || tag === "MarketSale"
}

function getProductSaleConcepts(concepts: ProductSaleConcept[]) {
  return concepts
    .filter((concept) => concept.productId)
    .map((concept) => ({
      productId: concept.productId as string,
      quantity: Number(concept.quantity),
      name: concept.name,
    }))
}

async function rollbackProductStockChanges(
  changes: Array<{ productId: string; quantity: number }>
) {
  for (const change of [...changes].reverse()) {
    await products.adjustStock(change.productId, change.quantity)
  }
}

async function reserveProductStockForSale(
  concepts: ProductSaleConcept[]
): Promise<
  | { success: true; changes: Array<{ productId: string; quantity: number }> }
  | { success: false; error: string }
> {
  const changes = getProductSaleConcepts(concepts)
  const appliedChanges: Array<{ productId: string; quantity: number }> = []

  for (const change of changes) {
    if (!Number.isInteger(change.quantity) || change.quantity <= 0) {
      await rollbackProductStockChanges(appliedChanges)
      return {
        success: false,
        error: `Invalid quantity for product ${change.name}`,
      }
    }

    const product = await products.findById(change.productId)
    if (!product) {
      await rollbackProductStockChanges(appliedChanges)
      return {
        success: false,
        error: `Product not found for concept ${change.name}`,
      }
    }

    if (product.stock == null) {
      continue
    }

    const decremented = await products.adjustStock(
      change.productId,
      -change.quantity
    )
    if (!decremented) {
      await rollbackProductStockChanges(appliedChanges)
      return {
        success: false,
        error: `Insufficient stock for product ${change.name}`,
      }
    }

    appliedChanges.push(change)
  }

  return { success: true, changes: appliedChanges }
}

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

    let stockReservation:
      | {
          success: true
          changes: Array<{ productId: string; quantity: number }>
        }
      | { success: false; error: string }
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

    const unlinkResult = await unlinkPaymentFromEvents(parsed.data.id, {
      events,
    })

    console.log(
      `Deleted payment ${parsed.data.id}; cleared ${unlinkResult.updatedAttendees} attendee link(s) across ${unlinkResult.updatedEvents} event(s)`
    )

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting payment: ${error}`)
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    )
  }
}
