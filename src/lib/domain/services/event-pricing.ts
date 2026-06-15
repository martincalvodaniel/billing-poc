import type { Event } from "../entities/event"

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Computes the Payment monetary fields for an Event attendee.
 *
 * `pricePerSeat` is the **gross** price per seat (VAT included). For
 * recurring weekly events, callers pass the number of monthly occurrences
 * (active dates in the event's month) so the total scales linearly:
 *
 *   total      = round2(pricePerSeat * seats * occurrences)
 *   net        = round2(total / (1 + vatRate/100))
 *   vatAmount  = round2(total - net)
 *
 * `durationMinutes` is informational and does NOT scale the price.
 */
export function computeEventPaymentAmount(
  event: Pick<Event, "pricePerSeat" | "vatRate" | "durationMinutes">,
  seats: number,
  occurrences = 1
): { netAmount: number; vatAmount: number; total: number; vatRate: number } {
  const safeOccurrences = Math.max(1, Math.trunc(occurrences))
  const total = round2(event.pricePerSeat * seats * safeOccurrences)
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

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

/**
 * Enumerate all ISO YYYY-MM-DD dates within (year, month) whose JS weekday
 * (`Date#getDay()`, 0=Sunday..6=Saturday) matches `dayOfWeek`. Pure: no
 * exclusions applied.
 */
function enumerateMonthlyOccurrences(
  year: number,
  month: number,
  dayOfWeek: number
): string[] {
  if (month < 1 || month > 12) return []
  if (dayOfWeek < 0 || dayOfWeek > 6) return []
  const result: string[] = []
  const lastDay = new Date(year, month, 0).getDate()
  for (let d = 1; d <= lastDay; d += 1) {
    const date = new Date(year, month - 1, d)
    if (date.getDay() === dayOfWeek) {
      result.push(`${year}-${pad2(month)}-${pad2(d)}`)
    }
  }
  return result
}

/**
 * Active monthly occurrences for an event = all weekday matches in
 * `(event.year, event.month)` minus `event.excludedDates`.
 *
 * Returns:
 * - `undefined` when the event lacks year/month/dayOfWeek (caller treats
 *   this as a single non-recurring event with 1 occurrence).
 * - An array of ISO YYYY-MM-DD strings otherwise.
 */
function activeMonthlyOccurrences(
  event: Pick<Event, "year" | "month" | "dayOfWeek" | "excludedDates">
): string[] | undefined {
  if (
    event.year === undefined ||
    event.month === undefined ||
    event.dayOfWeek === undefined
  ) {
    return undefined
  }
  const all = enumerateMonthlyOccurrences(
    event.year,
    event.month,
    event.dayOfWeek
  )
  const excluded = new Set(event.excludedDates ?? [])
  return all.filter((d) => !excluded.has(d))
}

/**
 * Number of active monthly occurrences. Returns 1 for non-recurring events
 * (no dayOfWeek or missing year/month), so the existing single-occurrence
 * pricing path stays correct.
 */
export function activeMonthlyOccurrencesCount(
  event: Pick<Event, "year" | "month" | "dayOfWeek" | "excludedDates">
): number {
  const list = activeMonthlyOccurrences(event)
  return list === undefined ? 1 : list.length
}
