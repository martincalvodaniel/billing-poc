import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import type { EventRepository } from "@/lib/domain/ports/event-repository"
import type { PaymentRepository } from "@/lib/domain/ports/payment-repository"
import { computeEventPaymentAmount } from "@/lib/domain/services/event-pricing"

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Creates a Payment for a single event attendee and writes the resulting
 * paymentId back to the attendee subdocument. Caller is responsible for
 * skipping attendees that already have a `paymentId` (idempotency).
 *
 * The Payment shape is fixed by the iteration plan (§1.5):
 * - type: "income", tag: "event"
 * - date: event.date if set, otherwise today's ISO date
 * - concepts: one line, name = event title (+ " (no date)" if event has no
 *   date), amount = (netAmount+vatAmount) * durationMultiplier, quantity =
 *   seats
 * - netAmount/vatAmount/total: from `computeEventPaymentAmount` directly
 * - vat: back-computed as (vatAmount/netAmount)*100 (0 if netAmount=0)
 */
export async function generateAttendeePayment(
  event: Event,
  attendee: EventAttendee,
  deps: { events: EventRepository; payments: PaymentRepository }
): Promise<string> {
  if (!event._id) {
    throw new Error("Event is missing an id; cannot generate payment")
  }

  const { netAmount, vatAmount, total } = computeEventPaymentAmount(
    event,
    attendee.seats
  )

  const multiplier =
    event.durationMinutes && event.durationMinutes > 0
      ? event.durationMinutes / 60
      : 1
  const perSeatRate = event.netAmount + event.vatAmount
  const conceptAmount = round2(perSeatRate * multiplier)
  const conceptName = event.date ? event.title : `${event.title} (no date)`
  const date = event.date ?? new Date().toISOString().slice(0, 10)
  const vat =
    event.netAmount > 0 ? round2((event.vatAmount / event.netAmount) * 100) : 0

  const now = new Date()
  const paymentId = await deps.payments.create({
    type: "income",
    date,
    tag: "event",
    clientId: attendee.clientId,
    concepts: [
      {
        name: conceptName,
        amount: conceptAmount,
        quantity: attendee.seats,
      },
    ],
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
