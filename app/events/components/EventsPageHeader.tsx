"use client"

import AddButton from "@/app/components/AddButton"
import MonthPicker from "@/app/month/components/MonthPicker"
import { formatMonthYear } from "@/lib/formatters"

interface EventsPageHeaderProps {
  selectedDate: Date
  showCalendar: boolean
  onShowCalendarChange: (show: boolean) => void
  isViewingCurrentMonth: boolean
  onGoToCurrentMonth: () => void
  onMonthChange: (year: number, month: number) => void
  onAddEvent: () => void
}

export default function EventsPageHeader({
  selectedDate,
  showCalendar,
  onShowCalendarChange,
  isViewingCurrentMonth,
  onGoToCurrentMonth,
  onMonthChange,
  onAddEvent,
}: EventsPageHeaderProps) {
  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 border-b border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Events
          </p>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {formatMonthYear(selectedDate)}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddButton ariaLabel="Add event" onClick={onAddEvent} />
          <MonthPicker
            selectedDate={selectedDate}
            onMonthChange={onMonthChange}
            showCalendar={showCalendar}
            onShowCalendarChange={onShowCalendarChange}
            isViewingCurrentMonth={isViewingCurrentMonth}
            onGoToCurrentMonth={onGoToCurrentMonth}
          />
        </div>
      </div>
    </div>
  )
}
