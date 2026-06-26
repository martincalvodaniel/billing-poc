import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoEventRepository } from "@/lib/db/repositories/mongo-event-repository"
import { MongoPaymentRepository } from "@/lib/db/repositories/mongo-payment-repository"
import { unlinkPaymentFromEvents } from "@/lib/domain/services/event-payment-service"
import { zodError } from "@/lib/utils/validation"
import { deletePaymentSchema } from "@/schemas/payment-validator"

const payments = new MongoPaymentRepository()
const events = new MongoEventRepository()

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
