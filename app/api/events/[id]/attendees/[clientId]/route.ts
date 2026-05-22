import { type NextRequest, NextResponse } from "next/server"
import { MongoEventRepository } from "@/lib/adapters/repositories/mongo-event-repository"
import { MongoPaymentRepository } from "@/lib/adapters/repositories/mongo-payment-repository"
import { requireAuth } from "@/lib/api-auth"
import { recomputeAttendeePayment } from "@/lib/domain/services/event-payment-service"
import { updateAttendeeSchema } from "@/lib/domain/services/event-validator"
import { zodError } from "@/lib/validation"

const events = new MongoEventRepository()
const payments = new MongoPaymentRepository()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clientId: string }> }
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const { id, clientId } = await params
    if (!id || !clientId) {
      return NextResponse.json(
        { error: "Event ID and Client ID are required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = updateAttendeeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodError(parsed.error) },
        { status: 400 }
      )
    }

    const { seats } = parsed.data

    const event = await events.findById(id)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const current = event.attendees.find((a) => a.clientId === clientId)
    if (!current) {
      return NextResponse.json({ error: "Attendee not found" }, { status: 404 })
    }

    if (seats !== undefined && event.maxAttendees !== undefined) {
      const otherSeats = event.attendees.reduce(
        (sum, a) => (a.clientId === clientId ? sum : sum + a.seats),
        0
      )
      if (otherSeats + seats > event.maxAttendees) {
        return NextResponse.json(
          {
            error: `Updating to ${seats} seat(s) would exceed the event capacity of ${event.maxAttendees}`,
          },
          { status: 409 }
        )
      }
    }

    const seatsChanged = seats !== undefined && seats !== current.seats
    let paymentSync:
      | { status: "missing" }
      | {
          status: "updated"
          paymentId: string
          netAmount: number
          vatAmount: number
          total: number
        }
      | null = null

    if (seatsChanged && current.paymentId) {
      const result = await recomputeAttendeePayment(
        event,
        current,
        seats as number,
        { payments }
      )

      if (result.status === "invoiced") {
        return NextResponse.json(
          {
            error: "cannot-modify-invoiced-payment",
            paymentId: result.paymentId,
            invoiceSeries: result.invoiceSeries,
            invoiceNumber: result.invoiceNumber,
          },
          { status: 409 }
        )
      }

      if (result.status === "missing") {
        console.warn(
          `Attendee ${clientId} on event ${id} references missing payment ${current.paymentId}; proceeding with seat update`
        )
        paymentSync = { status: "missing" }
      } else {
        paymentSync = {
          status: "updated",
          paymentId: result.paymentId,
          netAmount: result.netAmount,
          vatAmount: result.vatAmount,
          total: result.total,
        }
      }
    }

    const updated = await events.updateAttendee(id, clientId, { seats })
    if (!updated) {
      return NextResponse.json({ error: "Attendee not found" }, { status: 404 })
    }

    if (paymentSync?.status === "updated") {
      return NextResponse.json(
        {
          success: true,
          paymentSync: "updated",
          paymentId: paymentSync.paymentId,
          netAmount: paymentSync.netAmount,
          vatAmount: paymentSync.vatAmount,
          total: paymentSync.total,
        },
        { status: 200 }
      )
    }

    if (paymentSync?.status === "missing") {
      return NextResponse.json(
        { success: true, paymentSync: "missing" },
        { status: 200 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error updating attendee: ${error}`)
    return NextResponse.json(
      { error: "Failed to update attendee" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; clientId: string }> }
) {
  try {
    const denied = await requireAuth()
    if (denied) return denied

    const { id, clientId } = await params
    if (!id || !clientId) {
      return NextResponse.json(
        { error: "Event ID and Client ID are required" },
        { status: 400 }
      )
    }

    const removed = await events.removeAttendee(id, clientId)
    if (!removed) {
      return NextResponse.json({ error: "Attendee not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error removing attendee: ${error}`)
    return NextResponse.json(
      { error: "Failed to remove attendee" },
      { status: 500 }
    )
  }
}
