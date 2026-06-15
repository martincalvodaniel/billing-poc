"use client"

import { useMemo } from "react"
import MonthCalendarGrid from "@/components/ui/MonthCalendarGrid"
import { useStableCallback } from "@/hooks/useStableCallback"
import type { Absence } from "@/lib/domain/entities/absence"
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
  onSwipeToPreviousMonth: () => void
  onSwipeToNextMonth: () => void
}

export default function AbsencesMonthCalendar({
  records,
  selectedDate,
  onDayClick,
  onSwipeToPreviousMonth,
  onSwipeToNextMonth,
}: AbsencesMonthCalendarProps) {
  const handleDayClick = useStableCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const dateKey = event.currentTarget.dataset.dateKey
      if (dateKey) onDayClick(dateKey)
    }
  )
  function handleGet(cell: ReturnType<typeof buildMonthCells>[number]) {
    const dayCounts = counts.get(cell.key) ?? emptyDayCounts()
    const dimmed = !cell.inMonth
    return (
      <button
        key={cell.key}
        type="button"
        data-date-key={cell.key}
        onClick={handleDayClick}
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
          className={`text-xs font-semibold ${cell.isToday ? "text-blue-600 dark:text-blue-400" : ""}`}
        >
          {cell.date.getDate()}
        </span>
        <div className="mt-1 grid flex-1 grid-rows-2 divide-y divide-zinc-200 dark:divide-zinc-800">
          <div className="flex flex-wrap items-center gap-1 px-1 py-1">
            <DayPill count={dayCounts.morning.absences} kind="absence" />
            <DayPill count={dayCounts.morning.recoveries} kind="recovery" />
          </div>
          <div className="flex flex-wrap items-center gap-1 px-1 py-1">
            <DayPill count={dayCounts.evening.absences} kind="absence" />
            <DayPill count={dayCounts.evening.recoveries} kind="recovery" />
          </div>
        </div>
      </button>
    )
  }
  const counts = useMemo(() => aggregateByPart(records), [records])
  const todayKey = useMemo(() => toDateKey(new Date()), [])
  const cells = useMemo(
    () => buildMonthCells(selectedDate, todayKey),
    [selectedDate, todayKey]
  )
  return (
    <MonthCalendarGrid
      cells={cells}
      onSwipeToPreviousMonth={onSwipeToPreviousMonth}
      onSwipeToNextMonth={onSwipeToNextMonth}
      renderCell={handleGet}
    />
  )
}
