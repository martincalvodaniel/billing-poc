"use client"

import { useMemo } from "react"
import type { Event } from "@/lib/domain/entities/event"
import {
  buildDayAriaLabel,
  buildMonthCells,
  groupEventsByDate,
  toDateKey,
} from "./calendar/calendarUtils"
import EventDayCell from "./calendar/EventDayCell"

interface EventsMonthCalendarProps {
  events: Event[]
  selectedDate: Date
  onDayClick: (dateKey: string) => void
  onEventClick: (event: Event) => void
}

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function EventsMonthCalendar({
  events,
  selectedDate,
  onDayClick,
  onEventClick,
}: EventsMonthCalendarProps) {
  const grouped = useMemo(() => groupEventsByDate(events), [events])
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
          const dayEvents = grouped.get(cell.key) ?? []
          return (
            <EventDayCell
              key={cell.key}
              date={cell.date}
              inMonth={cell.inMonth}
              isToday={cell.isToday}
              events={dayEvents}
              ariaLabel={buildDayAriaLabel(cell.date, dayEvents.length)}
              onClick={() => onDayClick(cell.key)}
              onEventClick={onEventClick}
            />
          )
        })}
      </div>
    </div>
  )
}
