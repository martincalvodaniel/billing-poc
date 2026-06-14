"use client"
import { useId, useMemo, useState } from "react"
import GoToCurrentButton from "@/components/ui/GoToCurrentButton"
import NavButton from "@/components/ui/NavButton"
import PickerOverlay from "@/components/ui/PickerOverlay"
import { useStableCallback } from "@/hooks/useStableCallback"

interface YearPickerProps {
  selectedYear: number
  onYearChange: (year: number) => void
  isViewingCurrentYear: boolean
  onGoToCurrentYear: () => void
}
export default function YearPicker({
  selectedYear,
  onYearChange,
  isViewingCurrentYear,
  onGoToCurrentYear,
}: YearPickerProps) {
  function closeYearPicker() {
    return setShowYearPicker(false)
  }
  function handleYearInputEventChange(e: React.ChangeEvent<HTMLInputElement>) {
    return updateYearInput(e.target.value)
  }
  function handleYearInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      submitYearInput()
    }
  }
  function handleYearChangePrevious() {
    return handleYearChange("prev")
  }
  function toggleYearPicker() {
    return setShowYearPicker((open) => {
      return !open
    })
  }
  function handleYearChangeNext() {
    return handleYearChange("next")
  }
  const id = useId()
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [yearInput, setYearInput] = useState(() => selectedYear.toString())

  // Update yearInput when selectedYear changes externally
  const updateYearInput = (value: string) => {
    setYearInput(value)
  }
  const submitYearInput = () => {
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
          onClick={handleYearChangePrevious}
          aria-label="View previous year"
        >
          ←
        </NavButton>
        <div className="relative">
          <button
            type="button"
            onClick={toggleYearPicker}
            aria-haspopup="dialog"
            aria-expanded={showYearPicker}
            className="min-h-11 w-[4.5rem] rounded-lg border border-zinc-200 px-4 py-2 text-center text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
          >
            {selectedYear}
          </button>

          {showYearPicker ? (
            <PickerOverlay
              onClose={closeYearPicker}
              closeLabel="Close year picker"
              width="w-64"
              className="p-4"
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
                  onChange={handleYearInputEventChange}
                  onKeyDown={handleYearInputKeyDown}
                  className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  aria-label="Enter year manually"
                />
                <button
                  type="button"
                  onClick={submitYearInput}
                  className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-offset-zinc-900"
                >
                  Go
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {candidateYears.map((year) => (
                  <CandidateYear
                    key={year}
                    year={year}
                    active={year === selectedYear}
                    onSelect={handleYearSelect}
                  />
                ))}
              </div>
            </PickerOverlay>
          ) : null}
        </div>
        <NavButton onClick={handleYearChangeNext} aria-label="View next year">
          →
        </NavButton>
      </div>
    </div>
  )
}
function CandidateYear({
  year,
  active,
  onSelect,
}: {
  year: number
  active: boolean
  onSelect: (year: number) => void
}) {
  const handleClick = useStableCallback(() => onSelect(year))
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-md px-2 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
        active
          ? "bg-blue-600 text-white shadow-sm dark:bg-blue-700"
          : "border border-zinc-200 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      {year}
    </button>
  )
}
