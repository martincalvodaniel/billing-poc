"use client"

import { useMemo } from "react"
import type { Absence } from "../../../lib/domain/entities/absence"

interface AbsencesMonthCalendarProps {
  records: Absence[]
  selectedDate: Date
  onDayClick: (date: string) => void
}

interface PartCounts {
  absences: number
  recoveries: number
}

interface DayCounts {
  morning: PartCounts
  evening: PartCounts
}

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Monday-start day-of-week index: Mon=0..Sun=6.
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

function emptyDayCounts(): DayCounts {
  return {
    morning: { absences: 0, recoveries: 0 },
    evening: { absences: 0, recoveries: 0 },
  }
}

function aggregateByPart(records: Absence[]): Map<string, DayCounts> {
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

function buildAriaLabel(date: Date, dayCounts: DayCounts): string {
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

function renderPill(count: number, kind: "absence" | "recovery") {
  if (count <= 0) return null
  const isAbsence = kind === "absence"
  const pillClass = isAbsence
    ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
    : "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
  const dotClass = isAbsence ? "bg-red-500" : "bg-green-500"
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${pillClass}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${dotClass}`}
      />
      {count}
    </span>
  )
}

export default function AbsencesMonthCalendar({
  records,
  selectedDate,
  onDayClick,
}: AbsencesMonthCalendarProps) {
  const counts = useMemo(() => aggregateByPart(records), [records])
  const todayKey = useMemo(() => toDateKey(new Date()), [])

  const cells = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const offset = mondayIndex(firstOfMonth)
    const gridStart = new Date(year, month, 1 - offset)

    const result: Array<{
      date: Date
      key: string
      inMonth: boolean
      isToday: boolean
    }> = []
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
  }, [selectedDate, todayKey])

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAY_HEADERS.map((label) => (
          <div
            key={label}
            className="px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const dayCounts = counts.get(cell.key) ?? emptyDayCounts()
          const dimmed = !cell.inMonth
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onDayClick(cell.key)}
              aria-label={buildAriaLabel(cell.date, dayCounts)}
              className={`flex min-h-24 flex-col items-stretch gap-1 rounded-md border p-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${
                cell.isToday
                  ? "border-blue-500 ring-1 ring-blue-500 dark:border-blue-400 dark:ring-blue-400"
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              } ${
                dimmed
                  ? "bg-zinc-50/60 text-zinc-400 dark:bg-zinc-900/60 dark:text-zinc-600"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              <span
                className={`text-xs font-semibold ${
                  cell.isToday ? "text-blue-600 dark:text-blue-400" : ""
                }`}
              >
                {cell.date.getDate()}
              </span>
              <div className="mt-1 grid flex-1 grid-rows-2 divide-y divide-zinc-200 dark:divide-zinc-800">
                <div className="flex flex-wrap items-center gap-1 px-1 py-1">
                  {renderPill(dayCounts.morning.absences, "absence")}
                  {renderPill(dayCounts.morning.recoveries, "recovery")}
                </div>
                <div className="flex flex-wrap items-center gap-1 px-1 py-1">
                  {renderPill(dayCounts.evening.absences, "absence")}
                  {renderPill(dayCounts.evening.recoveries, "recovery")}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
