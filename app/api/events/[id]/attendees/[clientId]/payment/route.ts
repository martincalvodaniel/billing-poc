import { type NextRequest, NextResponse } from "next/server"
import { MongoEventRepository } from "@/lib/adapters/repositories/mongo-event-repository"
import { MongoPaymentRepository } from "@/lib/adapters/repositories/mongo-payment-repository"
import { requireAuth } from "@/lib/api-auth"
import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/domain/entities/payment"
import { generateAttendeePayment } from "@/lib/domain/services/event-payment-service"

const events = new MongoEventRepository()
const payments = new MongoPaymentRepository()

export async function POST(
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

    const event = await events.findById(id)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const attendee = event.attendees.find((a) => a.clientId === clientId)
    if (!attendee) {
      return NextResponse.json({ error: "Attendee not found" }, { status: 404 })
    }

    // Idempotent: do not create a second payment for an attendee that
    // already has one.
    if (attendee.paymentId) {
      return NextResponse.json(
        { alreadyExists: true, paymentId: attendee.paymentId },
        { status: 200 }
      )
    }

    let paymentMethod: PaymentMethod | undefined
    const body = await request.json().catch(() => null)
    if (body && typeof body === "object") {
      const maybeMethod = (body as { paymentMethod?: unknown }).paymentMethod
      if (maybeMethod !== undefined) {
        if (
          typeof maybeMethod !== "string" ||
          !PAYMENT_METHODS.includes(maybeMethod as PaymentMethod)
        ) {
          return NextResponse.json(
            { error: "Invalid payment method" },
            { status: 400 }
          )
        }
        paymentMethod = maybeMethod as PaymentMethod
      }
    }

    const paymentId = await generateAttendeePayment(event, attendee, {
      events,
      payments,
      paymentMethod,
    })

    return NextResponse.json({ success: true, paymentId }, { status: 201 })
  } catch (error) {
    console.error(`Error generating attendee payment: ${error}`)
    return NextResponse.json(
      { error: "Failed to generate payment" },
      { status: 500 }
    )
  }
}
