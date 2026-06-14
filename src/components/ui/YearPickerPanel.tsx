"use client"
import { useStableCallback } from "@/hooks/useStableCallback"
import PickerOverlay from "./PickerOverlay"

interface YearPickerPanelProps {
  yearPageBase: number
  selectedYear?: number
  onSelect: (year: number) => void
  onPageChange: (next: number) => void
  onClose: () => void
}
export default function YearPickerPanel({
  yearPageBase,
  selectedYear,
  onSelect,
  onPageChange,
  onClose,
}: YearPickerPanelProps) {
  const showPreviousYears = () => onPageChange(yearPageBase - 12)
  const showNextYears = () => onPageChange(yearPageBase + 12)
  const years = Array.from({ length: 12 }, (_, i) => yearPageBase + i)
  return (
    <PickerOverlay
      onClose={onClose}
      closeLabel="Close year picker"
      desktopAlign="left"
    >
      <div className="px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={showPreviousYears}
            aria-label="Previous years"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ←
          </button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {years[0]} – {years[years.length - 1]}
          </span>
          <button
            type="button"
            onClick={showNextYears}
            aria-label="Next years"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {years.map((year) => (
            <YearOption
              key={year}
              year={year}
              selected={selectedYear === year}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </PickerOverlay>
  )
}
function YearOption({
  year,
  selected,
  onSelect,
}: {
  year: number
  selected: boolean
  onSelect: (year: number) => void
}) {
  const handleClick = useStableCallback(() => onSelect(year))
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
      {year}
    </button>
  )
}
