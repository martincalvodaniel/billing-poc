import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import type { InvoiceSeries } from "@/lib/domain/entities/payment"
import type { EventRepository } from "@/lib/domain/ports/event-repository"
import type { PaymentRepository } from "@/lib/domain/ports/payment-repository"
import { computeEventPaymentAmount } from "@/lib/domain/services/event-pricing"

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Internal: shared concept-name + vat-rate + per-line amount derivation.
 * Used by both `generateAttendeePayment` (initial create) and
 * `recomputeAttendeePayment` (seat-change update).
 *
 * - `conceptName`: defaults to `event.title` (with `" (no date)"` suffix
 *   when the event has no date). Callers may override with an existing
 *   concept name to preserve user edits on update paths.
 * - `conceptAmount`: per-line amount = (net + vat) per seat × duration
 *   multiplier (where multiplier mirrors `computeEventPaymentAmount`).
 * - `vat`: rate back-computed from absolute vatAmount/netAmount.
 */
function buildPaymentLineParts(event: Event): {
  conceptName: string
  conceptAmount: number
  vat: number
  multiplier: number
} {
  const multiplier =
    event.durationMinutes && event.durationMinutes > 0
      ? event.durationMinutes / 60
      : 1
  const perSeatRate = event.netAmount + event.vatAmount
  const conceptAmount = round2(perSeatRate * multiplier)
  const conceptName = event.date ? event.title : `${event.title} (no date)`
  const vat =
    event.netAmount > 0 ? round2((event.vatAmount / event.netAmount) * 100) : 0
  return { conceptName, conceptAmount, vat, multiplier }
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

  const { conceptName, conceptAmount, vat } = buildPaymentLineParts(event)
  const date = event.date ?? new Date().toISOString().slice(0, 10)

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

// ---------------------------------------------------------------------------
// recomputeAttendeePayment
// ---------------------------------------------------------------------------

export type RecomputeAttendeePaymentResult =
  | { status: "missing" }
  | {
      status: "invoiced"
      paymentId: string
      invoiceSeries: InvoiceSeries
      invoiceNumber: number
    }
  | {
      status: "updated"
      paymentId: string
      netAmount: number
      vatAmount: number
      total: number
    }

/**
 * Refreshes the Payment linked to an event attendee when their seat count
 * changes.
 *
 * Behaviour:
 * - If the attendee has no `paymentId`, callers should not invoke this
 *   function. (We treat the missing case here only when the id is set but
 *   the document was deleted.)
 * - Loads the payment by `attendee.paymentId`.
 * - If the payment no longer exists → returns `{ status: "missing" }`. The
 *   attendee's `paymentId` is left untouched; the caller decides how to
 *   proceed.
 * - If the payment already has an `invoice` → returns
 *   `{ status: "invoiced", paymentId, invoiceSeries, invoiceNumber }`.
 *   Nothing is mutated.
 * - Otherwise → recomputes `{ netAmount, vatAmount, total }` via
 *   `computeEventPaymentAmount(event, newSeats)`, rewrites the single
 *   concept line (preserving its existing name) with the new per-line
 *   amount × `newSeats`, persists the change via `payments.update`, and
 *   returns `{ status: "updated", paymentId, netAmount, vatAmount, total }`.
 *
 * Pure with respect to Mongo: uses only the `PaymentRepository` port.
 */
export async function recomputeAttendeePayment(
  event: Event,
  attendee: EventAttendee,
  newSeats: number,
  deps: { payments: PaymentRepository }
): Promise<RecomputeAttendeePaymentResult> {
  if (!attendee.paymentId) {
    return { status: "missing" }
  }

  const paymentId = attendee.paymentId
  const payment = await deps.payments.findById(paymentId)
  if (!payment) {
    return { status: "missing" }
  }

  if (payment.invoice) {
    return {
      status: "invoiced",
      paymentId,
      invoiceSeries: payment.invoice.series,
      invoiceNumber: payment.invoice.number,
    }
  }

  const { netAmount, vatAmount, total } = computeEventPaymentAmount(
    event,
    newSeats
  )
  const { conceptName: defaultName, conceptAmount } =
    buildPaymentLineParts(event)
  const existingName = payment.concepts[0]?.name
  const conceptName = existingName ?? defaultName

  const now = new Date()
  await deps.payments.update(paymentId, {
    netAmount,
    vatAmount,
    total,
    concepts: [
      {
        name: conceptName,
        amount: conceptAmount,
        quantity: newSeats,
      },
    ],
    updatedAt: now,
  })

  return { status: "updated", paymentId, netAmount, vatAmount, total }
}
