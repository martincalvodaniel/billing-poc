import type { Event } from "@/lib/domain/entities/event"

export interface CalendarCell {
  date: Date
  key: string
  inMonth: boolean
  isToday: boolean
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Monday-start day-of-week index: Mon=0..Sun=6.
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

/**
 * Returns true when the recurring event "occurs" on `dateKey`. Recurring
 * events have a `dayOfWeek` (0=Sun..6=Sat) and a `year`/`month` scope; the
 * date must match that month/year and the weekday, and not be in
 * `excludedDates`.
 */
export function eventOccursOnRecurringDate(
  event: Event,
  date: Date,
  dateKey: string
): boolean {
  if (event.dayOfWeek === undefined) return false
  if (event.year === undefined || event.month === undefined) return false
  if (date.getFullYear() !== event.year) return false
  if (date.getMonth() + 1 !== event.month) return false
  if (date.getDay() !== event.dayOfWeek) return false
  if (event.excludedDates?.includes(dateKey)) return false
  return true
}

/**
 * Group events by their ISO date (`event.date`) PLUS the recurring
 * occurrences within `[year, month]`. Events with neither a fixed date nor
 * a `dayOfWeek` are ignored.
 */
export function groupEventsByDate(
  events: Event[],
  year?: number,
  month?: number
): Map<string, Event[]> {
  const map = new Map<string, Event[]>()
  const push = (key: string, event: Event) => {
    const bucket = map.get(key)
    if (bucket) bucket.push(event)
    else map.set(key, [event])
  }

  for (const event of events) {
    if (event.date) push(event.date, event)
  }

  if (year === undefined || month === undefined) return map

  const lastDay = new Date(year, month, 0).getDate()
  for (const event of events) {
    if (event.dayOfWeek === undefined) continue
    if (event.year !== year || event.month !== month) continue
    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month - 1, day)
      const key = toDateKey(date)
      // Skip the explicit-date bucket (already added above) when it
      // happens to fall on the same recurring weekday.
      if (event.date === key) continue
      if (eventOccursOnRecurringDate(event, date, key)) push(key, event)
    }
  }

  return map
}

export function buildMonthCells(
  selectedDate: Date,
  todayKey: string
): CalendarCell[] {
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const offset = mondayIndex(firstOfMonth)
  const gridStart = new Date(year, month, 1 - offset)

  const result: CalendarCell[] = []
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    )
    const key = toDateKey(date)
    result.push({
      date,
      key,
      inMonth: date.getMonth() === month,
      isToday: key === todayKey,
    })
  }
  return result
}

export function buildDayAriaLabel(date: Date, count: number): string {
  const dateLabel = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })
  if (count === 0) return `${dateLabel}, no events`
  const noun = count === 1 ? "event" : "events"
  return `${dateLabel}, ${count} ${noun}`
}
