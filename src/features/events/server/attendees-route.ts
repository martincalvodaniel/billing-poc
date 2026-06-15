import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"
import { MongoClientRepository } from "@/lib/db/repositories/mongo-client-repository"
import { MongoEventRepository } from "@/lib/db/repositories/mongo-event-repository"
import { zodError } from "@/lib/utils/validation"
import { addAttendeeSchema } from "@/schemas/event-validator"

const events = new MongoEventRepository()
const clients = new MongoClientRepository()

export async function POST(
  request: NextRequest,
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

    const body = await request.json()
    const parsed = addAttendeeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const { clientId, seats } = parsed.data

    const event = await events.findById(id)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const client = await clients.findById(clientId)
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const alreadyAttendee = event.attendees.some((a) => a.clientId === clientId)
    if (alreadyAttendee) {
      return NextResponse.json(
        { error: "Client is already an attendee of this event" },
        { status: 409 }
      )
    }

    if (event.maxAttendees !== undefined) {
      const currentSeats = event.attendees.reduce((sum, a) => sum + a.seats, 0)
      if (currentSeats + seats > event.maxAttendees) {
        return NextResponse.json(
          {
            error: `Adding ${seats} seat(s) would exceed the event capacity of ${event.maxAttendees}`,
          },
          { status: 409 }
        )
      }
    }

    const inserted = await events.addAttendee(id, {
      clientId,
      seats,
      addedAt: new Date(),
    })

    if (!inserted) {
      // Race: duplicate inserted between findById and addAttendee, or event
      // vanished. Both surface as 409 for clarity.
      return NextResponse.json(
        { error: "Unable to add attendee (duplicate or event not found)" },
        { status: 409 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error(`Error adding attendee: ${error}`)
    return NextResponse.json(
      { error: "Failed to add attendee" },
      { status: 500 }
    )
  }
}
