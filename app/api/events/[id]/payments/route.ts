import { type NextRequest, NextResponse } from "next/server"
import { MongoEventRepository } from "@/lib/adapters/repositories/mongo-event-repository"
import { MongoPaymentRepository } from "@/lib/adapters/repositories/mongo-payment-repository"
import { requireAuth } from "@/lib/api-auth"
import { generateAttendeePayment } from "@/lib/domain/services/event-payment-service"

const events = new MongoEventRepository()
const payments = new MongoPaymentRepository()

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      )
    }

    const event = await events.findById(id)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const created: string[] = []
    const skipped: string[] = []

    // Per the iteration plan, this loop is intentionally non-transactional;
    // each attendee write is individually idempotent (the precheck on
    // `paymentId` plus the per-attendee Mongo update).
    for (const attendee of event.attendees) {
      if (attendee.paymentId) {
        skipped.push(attendee.clientId)
        continue
      }
      const paymentId = await generateAttendeePayment(event, attendee, {
        events,
        payments,
      })
      created.push(paymentId)
    }

    return NextResponse.json({ created, skipped }, { status: 200 })
  } catch (error) {
    console.error(`Error generating event payments: ${error}`)
    return NextResponse.json(
      { error: "Failed to generate event payments" },
      { status: 500 }
    )
  }
}
