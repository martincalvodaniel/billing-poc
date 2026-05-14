import type { Event, EventAttendee } from "@/lib/domain/entities/event"
import { formatDate } from "@/lib/formatters"

/**
 * Format an event's date/time for display. Handles partial dates:
 *  - full year+month+day → "Apr 29, 2026"
 *  - year+month         → "April 2026"
 *  - year only          → "2026"
 *  - hour (with optional minute) appended as "HH:MM"
 *  - nothing             → "No date"
 */
export function formatEventDateTime(
  event: Pick<Event, "date" | "year" | "month" | "day" | "hour" | "minute">
): string {
  const datePart = formatEventDate(event)
  const timePart = formatEventTime(event)
  if (datePart === "" && timePart === "") return "No date"
  if (datePart === "") return timePart
  if (timePart === "") return datePart
  return `${datePart} ${timePart}`
}

function formatEventDate(
  event: Pick<Event, "date" | "year" | "month" | "day">
): string {
  if (event.date) {
    return formatDate(event.date)
  }
  if (event.year !== undefined && event.month !== undefined) {
    // Day missing — show "Month YYYY".
    const m = String(event.month).padStart(2, "0")
    // Use day 01 as anchor for locale formatting, then strip the day.
    return new Date(`${event.year}-${m}-01T00:00:00`).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long" }
    )
  }
  if (event.year !== undefined) {
    return String(event.year)
  }
  return ""
}

function formatEventTime(event: Pick<Event, "hour" | "minute">): string {
  if (event.hour === undefined) return ""
  const hh = String(event.hour).padStart(2, "0")
  const mm = String(event.minute ?? 0).padStart(2, "0")
  return `${hh}:${mm}`
}

/** Format an integer number of minutes as e.g. "1h 30m", "45m", "2h". */
export function formatDuration(minutes: number | undefined): string {
  if (minutes === undefined || !Number.isFinite(minutes) || minutes <= 0) {
    return "—"
  }
  const m = Math.floor(minutes)
  const hours = Math.floor(m / 60)
  const mins = m % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/** Sum seats across all attendees of an event. */
export function totalSeats(attendees: EventAttendee[]): number {
  let sum = 0
  for (const a of attendees) sum += a.seats
  return sum
}

/** True when the event has a derived ISO date and can be plotted on a calendar. */
export function eventIsPlottable(event: Pick<Event, "date">): boolean {
  return Boolean(event.date)
}
