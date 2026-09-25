import "server-only"

import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoInvoiceCounterRepository } from "@/lib/db/repositories/mongo-invoice-counter-repository"

const invoiceCounters = new MongoInvoiceCounterRepository()

export async function GET() {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const counters = await invoiceCounters.findAll()
    return NextResponse.json(
      {
        counters: counters.map(({ series, year, lastNumber }) => ({
          series,
          year,
          lastNumber,
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
