import type { Event } from "../entities/event"

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Computes the Payment monetary fields for an Event attendee.
 *
 * Pricing convention (binding):
 * - `event.pricePerSeat` is the **gross** price per seat (VAT included),
 *   in euros. A stored value of 10 means "the customer pays 10 € per seat"
 *   regardless of the event's duration.
 * - `event.vatRate` is the VAT rate as a percentage (0–100). The net and
 *   VAT amounts are **extracted** from the gross total.
 * - `event.durationMinutes` is purely informational (used by the calendar
 *   and listings); it does NOT scale the price.
 *
 * Formula:
 *   total      = round2(pricePerSeat * seats)
 *   net        = round2(total / (1 + vatRate/100))
 *   vatAmount  = round2(total - net)
 *
 * Example: pricePerSeat=10, vatRate=21, seats=1, durationMinutes=180
 *   → total=10.00, net=8.26, vatAmount=1.74.
 *
 * The returned `vatRate` mirrors `event.vatRate` and is stored on
 * `Payment.vat` (which represents the rate, not an absolute amount).
 */
export function computeEventPaymentAmount(
  event: Pick<Event, "pricePerSeat" | "vatRate" | "durationMinutes">,
  seats: number
): { netAmount: number; vatAmount: number; total: number; vatRate: number } {
  const total = round2(event.pricePerSeat * seats)
  const rate = event.vatRate
  const netAmount = round2(total / (1 + rate / 100))
  const vatAmount = round2(total - netAmount)
  return { netAmount, vatAmount, total, vatRate: rate }
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
