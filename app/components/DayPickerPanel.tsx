"use client"
import { useStableCallback } from "@/lib/hooks/useStableCallback"
import { WEEKDAY_HEADERS } from "./calendar-constants"
import PickerOverlay from "./PickerOverlay"
import { dayCalendarOffset } from "./partialDatePicker-utils"

interface DayPickerPanelProps {
  year: number
  month: number
  days: number[]
  selectedDay?: number
  onSelect: (day: number) => void
  onClose: () => void
}

export default function DayPickerPanel({
  year,
  month,
  days,
  selectedDay,
  onSelect,
  onClose,
}: DayPickerPanelProps) {
  const offset = dayCalendarOffset(year, month)
  const firstOfMonth = new Date(0, month - 1, 1)
  firstOfMonth.setFullYear(year)
  const monthLabel = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
  return (
    <PickerOverlay
      onClose={onClose}
      closeLabel="Close day picker"
      desktopAlign="left"
    >
      <div className="px-4 pb-4">
        <div className="mb-3 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {monthLabel}
        </div>
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY_HEADERS.map((weekday) => (
            <div
              key={weekday}
              className="py-1 text-center text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400"
            >
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_HEADERS.slice(0, offset).map((weekday) => (
            <div aria-hidden="true" key={`empty-${weekday}`} />
          ))}
          {days.map((day) => (
            <DayOption
              key={day}
              day={day}
              selected={selectedDay === day}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </PickerOverlay>
  )
}

function DayOption({
  day,
  selected,
  onSelect,
}: {
  day: number
  selected: boolean
  onSelect: (day: number) => void
}) {
  const handleClick = useStableCallback(() => onSelect(day))
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded px-2 py-2 text-xs font-medium ${
        selected
          ? "bg-blue-600 text-white dark:bg-blue-700"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {day}
    </button>
  )
}
