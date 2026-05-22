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
 * Group events by their ISO date (`event.date`). Events without a `date`
 * are intentionally ignored — they cannot be plotted on a calendar.
 */
export function groupEventsByDate(events: Event[]): Map<string, Event[]> {
  const map = new Map<string, Event[]>()
  for (const event of events) {
    if (!event.date) continue
    const bucket = map.get(event.date)
    if (bucket) {
      bucket.push(event)
    } else {
      map.set(event.date, [event])
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
