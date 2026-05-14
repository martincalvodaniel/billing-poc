import type { Event } from "../entities/event"

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Computes the Payment monetary fields for an Event attendee.
 *
 * Pricing convention (binding):
 * - `event.netAmount` and `event.vatAmount` are the **flat per-seat** prices.
 *   They are NOT per hour. A stored value of 50 means "50 € per seat".
 * - `event.durationMinutes` scales the resulting **Payment**, not the stored
 *   per-seat price. The multiplier is `durationMinutes / 60` when duration
 *   is set and > 0; otherwise it is `1`.
 *
 * Formula:
 *   multiplier = (durationMinutes && durationMinutes > 0) ? durationMinutes/60 : 1
 *   netAmount  = round2(event.netAmount * seats * multiplier)
 *   vatAmount  = round2(event.vatAmount * seats * multiplier)
 *   total      = round2(netAmount + vatAmount)
 *
 * Example: netAmount=50, vatAmount=0, durationMinutes=120, seats=1
 *   → Payment netAmount = 50 * 1 * 2 = 100 (NOT 25).
 *
 * This function only computes amounts; it never mutates the Event's stored
 * per-seat fields.
 */
export function computeEventPaymentAmount(
  event: Pick<Event, "netAmount" | "vatAmount" | "durationMinutes">,
  seats: number
): { netAmount: number; vatAmount: number; total: number } {
  const multiplier =
    event.durationMinutes && event.durationMinutes > 0
      ? event.durationMinutes / 60
      : 1
  const netAmount = round2(event.netAmount * seats * multiplier)
  const vatAmount = round2(event.vatAmount * seats * multiplier)
  const total = round2(netAmount + vatAmount)
  return { netAmount, vatAmount, total }
}

export function deriveEventDate(
  year?: number,
  month?: number,
  day?: number
): string | undefined {
  if (year === undefined || month === undefined || day === undefined) {
    return undefined
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined
  }
  const d = new Date(year, month - 1, day)
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return undefined
  }
  const mm = String(month).padStart(2, "0")
  const dd = String(day).padStart(2, "0")
  return `${year}-${mm}-${dd}`
}
