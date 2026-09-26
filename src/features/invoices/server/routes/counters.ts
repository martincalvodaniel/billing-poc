import "server-only"

import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoInvoiceCounterRepository } from "@/lib/db/repositories/mongo-invoice-counter-repository"
import { MongoPaymentRepository } from "@/lib/db/repositories/mongo-payment-repository"
import {
  getInvoiceOverview,
  reduceInvoiceCounter,
} from "@/lib/domain/services/invoice-administration"
import { zodError } from "@/lib/utils/validation"
import { invoiceCounterReductionSchema } from "@/schemas/invoice-validator"
import {
  invoiceReductionFailureStatus,
  serializeInvoiceReductionPreview,
} from "./counter-route-utils"

const invoiceCounters = new MongoInvoiceCounterRepository()
const payments = new MongoPaymentRepository()

export async function GET() {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const overview = await getInvoiceOverview(invoiceCounters, payments)
    return NextResponse.json(
      {
        counters: overview.counters.map(({ series, year, lastNumber }) => ({
          series,
          year,
          lastNumber,
        })),
        invoices: overview.invoices.map((invoice) => ({
          ...invoice,
          generatedAt: invoice.generatedAt.toISOString(),
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`Error fetching invoice counters: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch invoice counters" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const body = await request.json()
    const parsed = invoiceCounterReductionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const result = await reduceInvoiceCounter(
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
      {
        success: true,
        preview: serializeInvoiceReductionPreview(result.preview),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`Error reducing invoice counter: ${error}`)
    return NextResponse.json(
      { error: "Failed to reduce invoice counter" },
      { status: 500 }
    )
  }
}
