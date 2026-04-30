"use client"

import { useMemo } from "react"
import type { Absence } from "../../../lib/domain/entities/absence"
import {
  aggregateByPart,
  buildAriaLabel,
  buildMonthCells,
  emptyDayCounts,
  toDateKey,
} from "./calendar/calendarUtils"
import DayPill from "./calendar/DayPill"

interface AbsencesMonthCalendarProps {
  records: Absence[]
  selectedDate: Date
  onDayClick: (date: string) => void
}

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function AbsencesMonthCalendar({
  records,
  selectedDate,
  onDayClick,
}: AbsencesMonthCalendarProps) {
  const counts = useMemo(() => aggregateByPart(records), [records])
  const todayKey = useMemo(() => toDateKey(new Date()), [])
  const cells = useMemo(
    () => buildMonthCells(selectedDate, todayKey),
    [selectedDate, todayKey]
  )

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
                  <DayPill count={dayCounts.morning.absences} kind="absence" />
                  <DayPill
                    count={dayCounts.morning.recoveries}
                    kind="recovery"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1 px-1 py-1">
                  <DayPill count={dayCounts.evening.absences} kind="absence" />
                  <DayPill
                    count={dayCounts.evening.recoveries}
                    kind="recovery"
                  />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
