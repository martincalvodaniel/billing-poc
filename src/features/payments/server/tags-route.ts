import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoPaymentRepository } from "@/lib/db/repositories/mongo-payment-repository"

const payments = new MongoPaymentRepository()

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const type = request.nextUrl.searchParams.get("type") ?? undefined
    const tags = await payments.findDistinctTags(type)
    return NextResponse.json({ tags }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching tags: ${error}`)
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}
