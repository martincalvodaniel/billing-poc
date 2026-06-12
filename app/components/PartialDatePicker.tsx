"use client"
import { useEffect, useRef, useState } from "react"
import DayPickerPanel from "./DayPickerPanel"
import MonthPickerPanel from "./MonthPickerPanel"
import {
  coerceValue,
  daysValidFor,
  monthsValidFor,
  type PartialDateValue,
} from "./partialDatePicker-utils"
import YearPickerPanel from "./YearPickerPanel"

export type { PartialDateValue } from "./partialDatePicker-utils"

interface PartialDatePickerProps {
  value: PartialDateValue
  onChange: (next: PartialDateValue) => void
  disabled?: boolean
  disableDay?: boolean
  ariaLabelPrefix?: string
}
type Segment = "year" | "month" | "day"
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]
function formatYear(year?: number): string {
  return typeof year === "number" ? String(year) : "YEAR"
}
function formatMonth(month?: number): string {
  return typeof month === "number" ? MONTH_NAMES[month - 1] : "MONTH"
}
function formatDay(day?: number): string {
  return typeof day === "number" ? String(day) : "DAY"
}
export default function PartialDatePicker({
  value,
  onChange,
  disabled,
  disableDay = false,
  ariaLabelPrefix = "Date",
}: PartialDatePickerProps) {
  const closePicker = () => setOpenSegment(null)
  const [openSegment, setOpenSegment] = useState<Segment | null>(null)
  const [yearPageBase, setYearPageBase] = useState<number>(() => {
    const current = value.year ?? new Date().getFullYear()
    return current - 5
  })
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!openSegment) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenSegment(null)
      }
    }
    document.addEventListener("pointerdown", handleClickOutside)
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside)
    }
  }, [openSegment])
  const toggleSegment = (segment: Segment) => {
    if (disabled) return
    setOpenSegment((prev) => (prev === segment ? null : segment))
    if (segment === "year") {
      const current = value.year ?? new Date().getFullYear()
      setYearPageBase(current - 5)
    }
  }
  const handleClearDay = () => {
    if (disabled) return
    onChange(coerceValue({ year: value.year, month: value.month }))
  }
  const handleSelectYear = (year: number) => {
    onChange(coerceValue({ year, month: value.month, day: value.day }))
    setOpenSegment("month")
  }
  const handleSelectMonth = (month: number) => {
    onChange(coerceValue({ year: value.year, month, day: value.day }))
    setOpenSegment("day")
  }
  const handleSelectDay = (day: number) => {
    onChange(coerceValue({ year: value.year, month: value.month, day }))
    setOpenSegment(null)
  }

  const segmentButtonClass = (active: boolean) =>
    `min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
      active
        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-200"
        : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
    } dark:focus:ring-offset-zinc-900`

  const dayClearButtonClass =
    "absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-red-300 bg-white text-[10px] leading-none text-red-600 shadow-sm hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/60 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-900/30"
  const months = monthsValidFor(value.year)
  const days = daysValidFor(value.year, value.month)
  return (
    <div
      className="relative inline-flex flex-wrap items-center gap-2 md:flex-nowrap"
      ref={containerRef}
    >
      {(["year", "month", "day"] as const).map((segment) => {
        function handleClearDayClick(
          event: React.MouseEvent<HTMLButtonElement>
        ) {
          event.stopPropagation()
          handleClearDay()
        }
        const handleToggleSegment = () => toggleSegment(segment)
        const display =
          segment === "year"
            ? formatYear(value.year)
            : segment === "month"
              ? formatMonth(value.month)
              : formatDay(value.day)
        const hasValue =
          segment === "year"
            ? typeof value.year === "number"
            : segment === "month"
              ? typeof value.month === "number"
              : typeof value.day === "number"
        const segmentDisabled =
          disabled ||
          (segment === "day" && disableDay) ||
          (segment === "month" && typeof value.year !== "number") ||
          (segment === "day" && typeof value.month !== "number")
        return (
          <div className="relative flex items-center" key={segment}>
            <button
              type="button"
              onClick={handleToggleSegment}
              disabled={segmentDisabled}
              aria-label={`${ariaLabelPrefix} ${segment}`}
              aria-expanded={openSegment === segment}
              className={`${segmentButtonClass(openSegment === segment)} ${segment === "day" && hasValue && !disableDay ? "pr-6" : ""}`}
            >
              {display}
            </button>
            {segment === "day" && hasValue && !disableDay ? (
              <button
                type="button"
                onClick={handleClearDayClick}
                disabled={disabled}
                aria-label={`Clear ${ariaLabelPrefix} ${segment}`}
                className={dayClearButtonClass}
              >
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
          </div>
        )
      })}

      {openSegment === "year" ? (
        <YearPickerPanel
          yearPageBase={yearPageBase}
          selectedYear={value.year}
          onSelect={handleSelectYear}
          onPageChange={setYearPageBase}
          onClose={closePicker}
        />
      ) : null}

      {openSegment === "month" ? (
        <MonthPickerPanel
          months={months}
          selectedMonth={value.month}
          onSelect={handleSelectMonth}
          onClose={closePicker}
        />
      ) : null}

      {openSegment === "day" ? (
        <DayPickerPanel
          days={days}
          selectedDay={value.day}
          onSelect={handleSelectDay}
          onClose={closePicker}
        />
      ) : null}
    </div>
  )
}
