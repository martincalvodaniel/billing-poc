import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import type { PaymentMethod } from "@/lib/domain/entities/payment"
import type { EventRepository } from "@/lib/domain/ports/event-repository"
import type { PaymentRepository } from "@/lib/domain/ports/payment-repository"
import {
  buildPaymentLineParts,
  eventTag,
  todayLocalISO,
} from "@/lib/domain/services/event-payment-helpers"
import {
  activeMonthlyOccurrencesCount,
  computeEventPaymentAmount,
} from "@/lib/domain/services/event-pricing"

// Re-export the recompute/unlink helpers so existing consumers and tests can
// keep importing them from this module.
export {
  recomputeAllAttendeePayments,
  recomputeAttendeePayment,
  unlinkPaymentFromEvents,
} from "@/lib/domain/services/event-payment-recompute"

/**
 * Creates a Payment for a single event attendee and writes the resulting
 * paymentId back to the attendee subdocument. Caller is responsible for
 * skipping attendees that already have a `paymentId` (idempotency).
 *
 * The Payment shape is fixed by the iteration plan (§1.5):
 * - type: "income", tag: "event"
 * - date: today's local date (yyyy-mm-dd), independent of event.date
 * - concepts: one line, name = event title (+ month and optional hour when
 *   available), amount = pricePerSeat (gross per-seat; duration does NOT
 *   scale the price), quantity = seats
 * - netAmount/vatAmount/total: from `computeEventPaymentAmount` directly
 * - vat: the event's VAT rate (percentage), mirrored as-is
 */
export async function generateAttendeePayment(
  event: Event,
  attendee: EventAttendee,
  deps: {
    events: EventRepository
    payments: PaymentRepository
    paymentMethod?: PaymentMethod
  }
): Promise<string> {
  if (!event._id) {
    throw new Error("Event is missing an id; cannot generate payment")
  }

  const { netAmount, vatAmount, total } = computeEventPaymentAmount(
    event,
    attendee.seats,
    activeMonthlyOccurrencesCount(event)
  )

  const { conceptName, conceptAmount, vat } = buildPaymentLineParts(event)
  const date = todayLocalISO()

  const now = new Date()
  const paymentId = await deps.payments.create({
    type: "income",
    date,
    tag: eventTag(event),
    clientId: attendee.clientId,
    concepts: [
      {
        name: conceptName,
        amount: conceptAmount,
        quantity: attendee.seats,
      },
    ],
    paymentMethod: deps.paymentMethod,
    vat,
    netAmount,
    vatAmount,
    total,
    createdAt: now,
    updatedAt: now,
  })

  await deps.events.updateAttendee(event._id, attendee.clientId, {
    paymentId,
  })

  return paymentId
}
