import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getPaymentById } from "@/lib/server-cache"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const { id } = await params
    const payment = await getPaymentById(id)
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    console.log(`Fetched payment by id: ${id}`)
    return NextResponse.json({ payment }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching payment: ${error}`)
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    )
  }
}
