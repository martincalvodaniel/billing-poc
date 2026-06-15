"use client"
import { useCallback, useRef } from "react"
import MonthNavigationControls from "@/components/ui/MonthNavigationControls"
import PickerOverlay from "@/components/ui/PickerOverlay"
import { useClickOutside } from "@/hooks/useClickOutside"
import { useStableCallback } from "@/hooks/useStableCallback"

const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
const MONTH_SHORT_LABELS: readonly string[] = MONTH_INDEXES.map((m) =>
  new Date(2000, m).toLocaleDateString("en-US", { month: "short" })
)

interface MonthPickerProps {
  selectedDate: Date
  onMonthChange: (year: number, month: number) => void
  showCalendar: boolean
  onShowCalendarChange: (show: boolean) => void
  isViewingCurrentMonth: boolean
  onGoToCurrentMonth: () => void
}
export default function MonthPicker({
  selectedDate,
  onMonthChange,
  showCalendar,
  onShowCalendarChange,
  isViewingCurrentMonth,
  onGoToCurrentMonth,
}: MonthPickerProps) {
  const handleShowCalendarChange = () => onShowCalendarChange(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const handleOutsideClick = useCallback(() => {
    onShowCalendarChange(false)
  }, [onShowCalendarChange])
  useClickOutside(calendarRef, handleOutsideClick, showCalendar)
  const handlePrevYear = () => {
    onMonthChange(selectedDate.getFullYear() - 1, selectedDate.getMonth())
  }
  const handleNextYear = () => {
    onMonthChange(selectedDate.getFullYear() + 1, selectedDate.getMonth())
  }
  const handleDayPrev = () => {
    onMonthChange(selectedDate.getFullYear(), selectedDate.getMonth() - 1)
  }
  const handleDayNext = () => {
    onMonthChange(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
  }
  return (
    <div className="flex flex-wrap items-center gap-2" ref={calendarRef}>
      <MonthNavigationControls
        selectedDate={selectedDate}
        showCalendar={showCalendar}
        isViewingCurrentMonth={isViewingCurrentMonth}
        onGoToCurrentMonth={onGoToCurrentMonth}
        onShowCalendarChange={onShowCalendarChange}
        onPrevMonth={handleDayPrev}
        onNextMonth={handleDayNext}
        overlay={
          showCalendar ? (
            <PickerOverlay
              onClose={handleShowCalendarChange}
              closeLabel="Close calendar"
            >
              {/* Calendar Header */}
              <div className="border-b border-zinc-200 px-6 pb-4 dark:border-zinc-700">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleDayPrev}
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    aria-label="Previous month"
                  >
                    ←
                  </button>
                  <span className="flex-1 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth()
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={handleDayNext}
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    aria-label="Next month"
                  >
                    →
                  </button>
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {MONTH_INDEXES.map((month) => (
                    <MonthGridOption
                      key={month}
                      year={selectedDate.getFullYear()}
                      month={month}
                      selected={month === selectedDate.getMonth()}
                      onMonthChange={onMonthChange}
                      onClose={handleShowCalendarChange}
                    />
                  ))}
                </div>

                {/* Year Navigation */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={handlePrevYear}
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    aria-label="Previous year"
                  >
                    ←
                  </button>
                  <span className="flex-1 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedDate.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextYear}
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    aria-label="Next year"
                  >
                    →
                  </button>
                </div>
              </div>
            </PickerOverlay>
          ) : null
        }
      />
    </div>
  )
}
function MonthGridOption({
  year,
  month,
  selected,
  onMonthChange,
  onClose,
}: {
  year: number
  month: number
  selected: boolean
  onMonthChange: (year: number, month: number) => void
  onClose: () => void
}) {
  const handleClick = useStableCallback(() => {
    onMonthChange(year, month)
    onClose()
  })
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
      {MONTH_SHORT_LABELS[month]}
    </button>
  )
}
