import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { getEventById } from "@/lib/db/cache"
import { MongoEventRepository } from "@/lib/db/repositories/mongo-event-repository"
import { MongoPaymentRepository } from "@/lib/db/repositories/mongo-payment-repository"
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

    const event = await getEventById(id)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const skipped: string[] = []
    const pending: typeof event.attendees = []
    for (const attendee of event.attendees) {
      if (attendee.paymentId) {
        skipped.push(attendee.clientId)
      } else {
        pending.push(attendee)
      }
    }

    // Per the iteration plan, generation is intentionally non-transactional;
    // each attendee write is individually idempotent (the precheck on
    // `paymentId` plus the per-attendee Mongo update). Run pending writes
    // in parallel — each updateAttendee targets a distinct clientId via
    // the positional `$` operator, so concurrent writes on the same event
    // doc are safe.
    const created = await Promise.all(
      pending.map((attendee) =>
        generateAttendeePayment(event, attendee, { events, payments })
      )
    )

    return NextResponse.json({ created, skipped }, { status: 200 })
  } catch (error) {
    console.error(`Error generating event payments: ${error}`)
    return NextResponse.json(
      { error: "Failed to generate event payments" },
      { status: 500 }
    )
  }
}
