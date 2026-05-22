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
  return typeof year === "number" ? String(year) : "—"
}

function formatMonth(month?: number): string {
  return typeof month === "number" ? MONTH_NAMES[month - 1] : "—"
}

function formatDay(day?: number): string {
  return typeof day === "number" ? String(day) : "—"
}

export default function PartialDatePicker({
  value,
  onChange,
  disabled,
  ariaLabelPrefix = "Date",
}: PartialDatePickerProps) {
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

  const handleClear = (segment: Segment) => {
    if (disabled) return
    if (segment === "year") {
      onChange(coerceValue({}))
    } else if (segment === "month") {
      onChange(coerceValue({ year: value.year }))
    } else {
      onChange(coerceValue({ year: value.year, month: value.month }))
    }
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

  const clearButtonClass =
    "ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"

  const months = monthsValidFor(value.year)
  const days = daysValidFor(value.year, value.month)

  return (
    <div
      className="relative inline-flex flex-wrap items-center gap-2"
      ref={containerRef}
    >
      {(["year", "month", "day"] as const).map((segment) => {
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
          (segment === "month" && typeof value.year !== "number") ||
          (segment === "day" && typeof value.month !== "number")
        return (
          <div className="flex items-center" key={segment}>
            <button
              type="button"
              onClick={() => toggleSegment(segment)}
              disabled={segmentDisabled}
              aria-label={`${ariaLabelPrefix} ${segment}`}
              aria-expanded={openSegment === segment}
              className={segmentButtonClass(openSegment === segment)}
            >
              <span className="mr-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {segment}
              </span>
              {display}
            </button>
            {hasValue && (
              <button
                type="button"
                onClick={() => handleClear(segment)}
                disabled={disabled}
                aria-label={`Clear ${ariaLabelPrefix} ${segment}`}
                className={clearButtonClass}
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </div>
        )
      })}

      {openSegment === "year" && (
        <YearPickerPanel
          yearPageBase={yearPageBase}
          selectedYear={value.year}
          onSelect={handleSelectYear}
          onPageChange={setYearPageBase}
          onClose={() => setOpenSegment(null)}
        />
      )}

      {openSegment === "month" && (
        <MonthPickerPanel
          months={months}
          selectedMonth={value.month}
          onSelect={handleSelectMonth}
          onClose={() => setOpenSegment(null)}
        />
      )}

      {openSegment === "day" && (
        <DayPickerPanel
          days={days}
          selectedDay={value.day}
          onSelect={handleSelectDay}
          onClose={() => setOpenSegment(null)}
        />
      )}
    </div>
  )
}
