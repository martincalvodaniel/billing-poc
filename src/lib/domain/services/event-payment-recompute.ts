import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import {
  getPaymentInvoices,
  type InvoiceType,
} from "@/lib/domain/entities/payment"
import type { EventRepository } from "@/lib/domain/ports/event-repository"
import type { PaymentRepository } from "@/lib/domain/ports/payment-repository"
import {
  buildPaymentLineParts,
  eventTag,
} from "@/lib/domain/services/event-payment-helpers"
import {
  activeMonthlyOccurrencesCount,
  computeEventPaymentAmount,
} from "@/lib/domain/services/event-pricing"

export type RecomputeAttendeePaymentResult =
  | { status: "missing" }
  | {
      status: "invoiced"
      paymentId: string
      invoiceType: InvoiceType
      invoiceId: string
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
 *   `{ status: "invoiced", paymentId, invoiceType, invoiceId }`.
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

  const entries = getPaymentInvoices(payment)
  const invoiced = [...entries].reverse().find((e) => Boolean(e.id))
  if (invoiced?.id) {
    return {
      status: "invoiced",
      paymentId,
      invoiceType: invoiced.type,
      invoiceId: invoiced.id,
    }
  }

  const { netAmount, vatAmount, total } = computeEventPaymentAmount(
    event,
    newSeats,
    activeMonthlyOccurrencesCount(event)
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
    tag: eventTag(event),
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

export interface RecomputeAllResult {
  updated: string[]
  skippedInvoiced: Array<{
    paymentId: string
    invoiceType: InvoiceType
    invoiceId: string
  }>
  missing: string[]
}

export interface UnlinkPaymentFromEventsResult {
  updatedAttendees: number
  updatedEvents: number
}

/**
 * Refreshes every attendee's linked payment after the event itself
 * changes (e.g. price, VAT rate, dayOfWeek, excludedDates). Attendees
 * with no `paymentId` are ignored. Already-invoiced payments are
 * recorded in `skippedInvoiced` and left untouched.
 */
export async function recomputeAllAttendeePayments(
  event: Event,
  deps: { payments: PaymentRepository }
): Promise<RecomputeAllResult> {
  const updated: string[] = []
  const skippedInvoiced: RecomputeAllResult["skippedInvoiced"] = []
  const missing: string[] = []

  for (const attendee of event.attendees) {
    if (!attendee.paymentId) continue
    const result = await recomputeAttendeePayment(
      event,
      attendee,
      attendee.seats,
      deps
    )
    if (result.status === "updated") {
      updated.push(result.paymentId)
    } else if (result.status === "invoiced") {
      skippedInvoiced.push({
        paymentId: result.paymentId,
        invoiceType: result.invoiceType,
        invoiceId: result.invoiceId,
      })
    } else if (result.status === "missing") {
      missing.push(attendee.paymentId)
    }
  }

  return { updated, skippedInvoiced, missing }
}

/**
 * Removes a deleted payment reference from all event attendees that point to it.
 */
export async function unlinkPaymentFromEvents(
  paymentId: string,
  deps: { events: EventRepository }
): Promise<UnlinkPaymentFromEventsResult> {
  const allEvents = await deps.events.findAll({})
  let updatedAttendees = 0
  const updatedEventIds = new Set<string>()

  for (const event of allEvents) {
    if (!event._id) continue

    for (const attendee of event.attendees) {
      if (attendee.paymentId !== paymentId) continue

      const updated = await deps.events.updateAttendee(
        event._id,
        attendee.clientId,
        { paymentId: null }
      )

      if (updated) {
        updatedAttendees += 1
        updatedEventIds.add(event._id)
      }
    }
  }

  return {
    updatedAttendees,
    updatedEvents: updatedEventIds.size,
  }
}
