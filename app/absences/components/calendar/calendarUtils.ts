import type { Absence } from "@/lib/domain/entities/absence"

export interface PartCounts {
  absences: number
  recoveries: number
}

export interface DayCounts {
  morning: PartCounts
  evening: PartCounts
}

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

export function emptyDayCounts(): DayCounts {
  return {
    morning: { absences: 0, recoveries: 0 },
    evening: { absences: 0, recoveries: 0 },
  }
}

export function aggregateByPart(records: Absence[]): Map<string, DayCounts> {
  const map = new Map<string, DayCounts>()
  for (const record of records) {
    const existing = map.get(record.date) ?? emptyDayCounts()
    const bucket =
      record.partOfDay === "morning" ? existing.morning : existing.evening
    if (record.type === "absence") {
      bucket.absences += 1
    } else {
      bucket.recoveries += 1
    }
    map.set(record.date, existing)
  }
  return map
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function buildAriaLabel(date: Date, dayCounts: DayCounts): string {
  const dateLabel = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })
  const { morning, evening } = dayCounts
  const isEmpty =
    morning.absences === 0 &&
    morning.recoveries === 0 &&
    evening.absences === 0 &&
    evening.recoveries === 0
  if (isEmpty) {
    return `${dateLabel}, no records`
  }
  const morningLabel = `Morning: ${pluralize(
    morning.absences,
    "absence",
    "absences"
  )}, ${pluralize(morning.recoveries, "recovery", "recoveries")}`
  const eveningLabel = `Evening: ${pluralize(
    evening.absences,
    "absence",
    "absences"
  )}, ${pluralize(evening.recoveries, "recovery", "recoveries")}`
  return `${dateLabel}, ${morningLabel}; ${eveningLabel}`
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
