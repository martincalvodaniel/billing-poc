"use client"

import { useMemo } from "react"
import MonthCalendarGrid from "@/app/components/MonthCalendarGrid"
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

export default function EventsMonthCalendar({
  events,
  selectedDate,
  onDayClick,
  onEventClick,
}: EventsMonthCalendarProps) {
  const grouped = useMemo(
    () =>
      groupEventsByDate(
        events,
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1
      ),
    [events, selectedDate]
  )
  const todayKey = useMemo(() => toDateKey(new Date()), [])
  const cells = useMemo(
    () => buildMonthCells(selectedDate, todayKey),
    [selectedDate, todayKey]
  )

  return (
    <MonthCalendarGrid
      cells={cells}
      renderCell={(cell) => {
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
      }}
    />
  )
}
