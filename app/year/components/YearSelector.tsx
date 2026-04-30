"use client"

import { useId, useMemo, useState } from "react"
import GoToCurrentButton from "../../components/GoToCurrentButton"
import NavButton from "../../components/NavButton"

interface YearSelectorProps {
  selectedYear: number
  onYearChange: (year: number) => void
  isViewingCurrentYear: boolean
  onGoToCurrentYear: () => void
}

export default function YearSelector({
  selectedYear,
  onYearChange,
  isViewingCurrentYear,
  onGoToCurrentYear,
}: YearSelectorProps) {
  const id = useId()
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [yearInput, setYearInput] = useState(() => selectedYear.toString())

  // Update yearInput when selectedYear changes externally
  const handleYearInputChange = (value: string) => {
    setYearInput(value)
  }

  const handleYearInputSubmit = () => {
    const parsed = parseInt(yearInput, 10)
    if (Number.isNaN(parsed)) return
    onYearChange(parsed)
    setShowYearPicker(false)
  }

  const handleYearSelect = (year: number) => {
    onYearChange(year)
    setShowYearPicker(false)
  }

  const handleYearChange = (direction: "prev" | "next") => {
    onYearChange(direction === "prev" ? selectedYear - 1 : selectedYear + 1)
    setShowYearPicker(false)
  }

  const candidateYears = useMemo(() => {
    const base = selectedYear
    return Array.from({ length: 12 }, (_, idx) => base - 6 + idx)
  }, [selectedYear])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <GoToCurrentButton
        disabled={isViewingCurrentYear}
        onClick={onGoToCurrentYear}
        label="Jump to current year"
      />
      <div className="flex items-center gap-1">
        <NavButton
          onClick={() => handleYearChange("prev")}
          aria-label="View previous year"
        >
          ←
        </NavButton>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowYearPicker((open) => !open)}
            aria-haspopup="dialog"
            aria-expanded={showYearPicker}
            className="min-h-11 w-[4.5rem] rounded-lg border border-zinc-200 px-4 py-2 text-center text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
          >
            {selectedYear}
          </button>

          {showYearPicker && (
            <div
              role="dialog"
              aria-modal="true"
              className="absolute left-0 top-full z-40 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg sm:left-auto sm:right-0 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`${id}-year-input`}
                  className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                >
                  Year
                </label>
                <input
                  id={`${id}-year-input`}
                  type="number"
                  inputMode="numeric"
                  value={yearInput}
                  onChange={(e) => handleYearInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleYearInputSubmit()
                    }
                  }}
                  className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  aria-label="Enter year manually"
                />
                <button
                  type="button"
                  onClick={handleYearInputSubmit}
                  className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-offset-zinc-900"
                >
                  Go
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {candidateYears.map((year) => {
                  const isActive = year === selectedYear
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleYearSelect(year)}
                      className={`rounded-md px-2 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm dark:bg-blue-700"
                          : "border border-zinc-200 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {year}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <NavButton
          onClick={() => handleYearChange("next")}
          aria-label="View next year"
        >
          →
        </NavButton>
      </div>
    </div>
  )
}
