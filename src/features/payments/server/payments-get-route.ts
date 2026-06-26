import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoPaymentRepository } from "@/lib/db/repositories/mongo-payment-repository"
import { zodError } from "@/lib/utils/validation"
import { paymentQuerySchema } from "@/schemas/payment-validator"

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
