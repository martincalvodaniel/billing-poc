import "server-only"

import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoInvoiceCounterRepository } from "@/lib/db/repositories/mongo-invoice-counter-repository"
import { MongoPaymentRepository } from "@/lib/db/repositories/mongo-payment-repository"
import { previewInvoiceCounterReduction } from "@/lib/domain/services/invoice-administration"
import { zodError } from "@/lib/utils/validation"
import { invoiceCounterTargetSchema } from "@/schemas/invoice-validator"
import {
  invoiceReductionFailureStatus,
  serializeInvoiceReductionPreview,
} from "./counter-route-utils"

const invoiceCounters = new MongoInvoiceCounterRepository()
const payments = new MongoPaymentRepository()

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = invoiceCounterTargetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const result = await previewInvoiceCounterReduction(
      invoiceCounters,
      payments,
      parsed.data
    )
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, reason: result.reason },
        { status: invoiceReductionFailureStatus(result.reason) }
      )
    }

    return NextResponse.json(
      { preview: serializeInvoiceReductionPreview(result.preview) },
      { status: 200 }
    )
  } catch (error) {
    console.error(`Error previewing invoice counter reduction: ${error}`)
    return NextResponse.json(
      { error: "Failed to preview invoice counter reduction" },
      { status: 500 }
    )
  }
}
