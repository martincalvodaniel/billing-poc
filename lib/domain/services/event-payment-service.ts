import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import {
  getPaymentInvoices,
  type InvoiceType,
} from "@/lib/domain/entities/payment"
import type { EventRepository } from "@/lib/domain/ports/event-repository"
import type { PaymentRepository } from "@/lib/domain/ports/payment-repository"
import {
  activeMonthlyOccurrencesCount,
  computeEventPaymentAmount,
} from "@/lib/domain/services/event-pricing"

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function todayLocalISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const DEFAULT_EVENT_TAG = "event"

function eventTag(event: Event): string {
  const trimmed = event.tag?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_EVENT_TAG
}

function eventMonthLabel(event: Event): string {
  let year = event.year
  let month = event.month

  if ((!year || !month) && event.date) {
    const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(event.date)
    if (match) {
      year = Number(match[1])
      month = Number(match[2])
    }
  }

  if (!year || !month || month < 1 || month > 12) {
    return ""
  }

  const label = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)))

  return label.length > 0 ? `${label[0].toUpperCase()}${label.slice(1)}` : ""
}

function eventTimeLabel(event: Event): string {
  if (event.hour === undefined) return ""
  const hour = String(event.hour).padStart(2, "0")
  const minute = String(event.minute ?? 0).padStart(2, "0")
  return `${hour}:${minute}`
}

function eventWeekdayLabel(event: Event): string {
  if (
    event.dayOfWeek === undefined ||
    event.dayOfWeek < 0 ||
    event.dayOfWeek > 6
  ) {
    return ""
  }

  const label = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, 0, 4 + event.dayOfWeek)))

  return label.length > 0 ? `${label[0].toUpperCase()}${label.slice(1)}` : ""
}

function eventConceptName(event: Event): string {
  const weekday = eventWeekdayLabel(event)
  const month = eventMonthLabel(event)
  const time = eventTimeLabel(event)

  let details = ""
  if (weekday && month) {
    details = `${month} ${weekday}`
  } else if (weekday) {
    details = weekday
  } else if (month) {
    details = month
  }

  if (time) {
    details = details.length > 0 ? `${details} ${time}` : time
  }

  return details.length > 0 ? `${event.title} (${details})` : event.title
}

/**
 * Internal: shared concept-name + per-line amount. The per-line `amount`
 * scales by the event's active monthly occurrences (1 for non-recurring
 * events) so seat × amount = total.
 */
function buildPaymentLineParts(event: Event): {
  conceptName: string
  conceptAmount: number
  vat: number
  occurrences: number
} {
  const occurrences = activeMonthlyOccurrencesCount(event)
  const conceptAmount = round2(event.pricePerSeat * occurrences)
  const conceptName = eventConceptName(event)
  return { conceptName, conceptAmount, vat: event.vatRate, occurrences }
}

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
  deps: { events: EventRepository; payments: PaymentRepository }
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

// ---------------------------------------------------------------------------
// recomputeAllAttendeePayments
// ---------------------------------------------------------------------------

export interface RecomputeAllResult {
  updated: string[]
  skippedInvoiced: Array<{
    paymentId: string
    invoiceType: InvoiceType
    invoiceId: string
  }>
  missing: string[]
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
