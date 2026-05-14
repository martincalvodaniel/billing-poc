import type { Event } from "../entities/event"

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

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
