"use client"

import { useEffect, useRef } from "react"
import GoToCurrentButton from "../../components/GoToCurrentButton"
import NavButton from "../../components/NavButton"

interface MonthSelectorProps {
  selectedDate: Date
  onMonthChange: (year: number, month: number) => void
  showCalendar: boolean
  onShowCalendarChange: (show: boolean) => void
  isViewingCurrentMonth: boolean
  onGoToCurrentMonth: () => void
}

export default function MonthSelector({
  selectedDate,
  onMonthChange,
  showCalendar,
  onShowCalendarChange,
  isViewingCurrentMonth,
  onGoToCurrentMonth,
}: MonthSelectorProps) {
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showCalendar) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        onShowCalendarChange(false)
      }
    }

    document.addEventListener("pointerdown", handleClickOutside)
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside)
    }
  }, [showCalendar, onShowCalendarChange])

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    })
  }

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
      <GoToCurrentButton
        disabled={isViewingCurrentMonth}
        onClick={onGoToCurrentMonth}
        label="Go to current month"
      />
      <div className="flex items-center gap-0.75">
        <NavButton onClick={handleDayPrev} aria-label="View previous month">
          ←
        </NavButton>
        <div className="relative">
          <button
            type="button"
            onClick={() => onShowCalendarChange(!showCalendar)}
            aria-label={`Select month, currently viewing ${formatMonthYear(selectedDate)}`}
            aria-expanded={showCalendar}
            className="min-h-11 w-[7.5rem] rounded-lg border border-zinc-200 px-4 py-2 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
          >
            {formatMonthYear(selectedDate)}
          </button>
          {showCalendar && (
            <div className="fixed left-1/2 top-1/2 z-50 w-72 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:translate-x-0 sm:translate-y-0 dark:border-zinc-700 dark:bg-zinc-900">
              {/* Calendar Header */}
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
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
                  {Array.from({ length: 12 }, (_, i) => i).map((monthIndex) => {
                    const year = selectedDate.getFullYear()
                    const month = monthIndex
                    const isSelected =
                      year === selectedDate.getFullYear() &&
                      month === selectedDate.getMonth()

                    return (
                      <button
                        type="button"
                        key={new Date(year, monthIndex).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                          }
                        )}
                        onClick={() => {
                          onMonthChange(year, month)
                          onShowCalendarChange(false)
                        }}
                        className={`rounded px-2 py-2 text-xs font-medium ${
                          isSelected
                            ? "bg-blue-600 text-white dark:bg-blue-700"
                            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {new Date(year, month).toLocaleDateString("en-US", {
                          month: "short",
                        })}
                      </button>
                    )
                  })}
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
            </div>
          )}
        </div>
        <NavButton onClick={handleDayNext} aria-label="View next month">
          →
        </NavButton>
      </div>
    </div>
  )
}
