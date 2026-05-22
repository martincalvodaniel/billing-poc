"use client"

import PickerOverlay from "./PickerOverlay"

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

interface MonthPickerPanelProps {
  months: number[]
  selectedMonth?: number
  onSelect: (month: number) => void
  onClose: () => void
}

export default function MonthPickerPanel({
  months,
  selectedMonth,
  onSelect,
  onClose,
}: MonthPickerPanelProps) {
  return (
    <PickerOverlay onClose={onClose} closeLabel="Close month picker">
      <div className="px-4 pb-4">
        <div className="grid grid-cols-4 gap-2">
          {months.map((month) => {
            const isSelected = selectedMonth === month
            return (
              <button
                type="button"
                key={month}
                onClick={() => onSelect(month)}
                className={`rounded px-2 py-2 text-xs font-medium ${
                  isSelected
                    ? "bg-blue-600 text-white dark:bg-blue-700"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {MONTH_NAMES[month - 1]}
              </button>
            )
          })}
        </div>
      </div>
    </PickerOverlay>
  )
}
