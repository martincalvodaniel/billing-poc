"use client"

import { useMemo } from "react"
import type { Absence } from "../../../lib/domain/entities/absence"

interface AbsencesMonthCalendarProps {
  records: Absence[]
  selectedDate: Date
  onDayClick: (date: string) => void
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

function aggregateCounts(
  records: Absence[]
): Map<string, { absences: number; recoveries: number }> {
  const map = new Map<string, { absences: number; recoveries: number }>()
  for (const record of records) {
    const existing = map.get(record.date) ?? { absences: 0, recoveries: 0 }
    if (record.type === "absence") {
      existing.absences += 1
    } else {
      existing.recoveries += 1
    }
    map.set(record.date, existing)
  }
  return map
}

function buildAriaLabel(
  date: Date,
  absences: number,
  recoveries: number
): string {
  const dateLabel = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })
  const parts: string[] = [dateLabel]
  if (absences > 0) {
    parts.push(`${absences} ${absences === 1 ? "absence" : "absences"}`)
  }
  if (recoveries > 0) {
    parts.push(`${recoveries} ${recoveries === 1 ? "recovery" : "recoveries"}`)
  }
  return parts.join(", ")
}

export default function AbsencesMonthCalendar({
  records,
  selectedDate,
  onDayClick,
}: AbsencesMonthCalendarProps) {
  const counts = useMemo(() => aggregateCounts(records), [records])
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
          const dayCounts = counts.get(cell.key)
          const absences = dayCounts?.absences ?? 0
          const recoveries = dayCounts?.recoveries ?? 0
          const dimmed = !cell.inMonth
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onDayClick(cell.key)}
              aria-label={buildAriaLabel(cell.date, absences, recoveries)}
              className={`flex min-h-20 flex-col items-start gap-1 rounded-md border p-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${
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
              {(absences > 0 || recoveries > 0) && (
                <div className="mt-auto flex flex-wrap items-center gap-1.5">
                  {absences > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-red-500"
                      />
                      {absences}
                    </span>
                  )}
                  {recoveries > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-green-500"
                      />
                      {recoveries}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
