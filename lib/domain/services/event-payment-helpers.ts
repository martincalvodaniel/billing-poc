import type { Event } from "@/lib/domain/entities/event"
import { activeMonthlyOccurrencesCount } from "@/lib/domain/services/event-pricing"

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function todayLocalISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const DEFAULT_EVENT_TAG = "event"

export function eventTag(event: Event): string {
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
export function buildPaymentLineParts(event: Event): {
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
