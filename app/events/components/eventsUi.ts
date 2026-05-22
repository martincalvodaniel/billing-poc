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
  const timePart = formatEventTime(event) ?? ""
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

function formatEventTime(
  event: Pick<Event, "hour" | "minute">
): string | undefined {
  if (event.hour === undefined || event.hour === null) return undefined
  const hour = Number(event.hour)
  if (!Number.isFinite(hour)) return undefined
  const minuteValue =
    event.minute === undefined || event.minute === null
      ? 0
      : Number(event.minute)
  if (!Number.isFinite(minuteValue)) return undefined
  const hh = String(Math.trunc(hour)).padStart(2, "0")
  const mm = String(Math.trunc(minuteValue)).padStart(2, "0")
  return `${hh}:${mm}`
}

export function formatEventTimeAndTitle(
  event: Pick<Event, "hour" | "minute" | "title">
): string {
  const time = formatEventTime(event)
  return time ? `${time} - ${event.title}` : event.title
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

/**
 * Format an optional hour + minute pair as "HH:MM" for `<input type="time">`.
 * Returns an empty string when `hour` is not a finite integer; missing minute
 * is treated as 0 when hour is present.
 */
export function formatTimeOfDay(
  hour: number | undefined,
  minute: number | undefined
): string {
  if (typeof hour !== "number" || !Number.isFinite(hour)) return ""
  const hh = String(Math.trunc(hour)).padStart(2, "0")
  const minuteValue =
    typeof minute === "number" && Number.isFinite(minute)
      ? Math.trunc(minute)
      : 0
  const mm = String(minuteValue).padStart(2, "0")
  return `${hh}:${mm}`
}

/**
 * Parse a `<input type="time">` value ("HH:MM") into hour/minute numbers.
 * An empty or unparseable value clears both fields.
 */
export function parseTimeOfDay(value: string): {
  hour?: number
  minute?: number
} {
  const trimmed = value.trim()
  if (trimmed.length === 0) return {}
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed)
  if (!match) return {}
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return {}
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return {}
  return { hour, minute }
}

/**
 * Compare two events chronologically ascending. Undefined parts sort first at
 * every level (year → month → day → hour → minute). Final tie-break is
 * `createdAt` ascending; undefined `createdAt` is treated as equal (stable).
 */
export function compareEventsChronologicalAsc(
  a: Pick<Event, "year" | "month" | "day" | "hour" | "minute" | "createdAt">,
  b: Pick<Event, "year" | "month" | "day" | "hour" | "minute" | "createdAt">
): number {
  const byYear = cmpOptUndefinedFirst(a.year, b.year)
  if (byYear !== 0) return byYear
  const byMonth = cmpOptUndefinedFirst(a.month, b.month)
  if (byMonth !== 0) return byMonth
  const byDay = cmpOptUndefinedFirst(a.day, b.day)
  if (byDay !== 0) return byDay
  const byHour = cmpOptUndefinedFirst(a.hour, b.hour)
  if (byHour !== 0) return byHour
  const byMinute = cmpOptUndefinedFirst(a.minute, b.minute)
  if (byMinute !== 0) return byMinute
  const aT = a.createdAt instanceof Date ? a.createdAt.getTime() : undefined
  const bT = b.createdAt instanceof Date ? b.createdAt.getTime() : undefined
  if (aT === undefined || bT === undefined) return 0
  return aT - bT
}

function cmpOptUndefinedFirst(
  a: number | undefined,
  b: number | undefined
): number {
  if (a === b) return 0
  if (a === undefined) return -1
  if (b === undefined) return 1
  return a - b
}
