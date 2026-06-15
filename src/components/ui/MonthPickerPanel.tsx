"use client"
import { useStableCallback } from "@/hooks/useStableCallback"
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
    <PickerOverlay
      onClose={onClose}
      closeLabel="Close month picker"
      desktopAlign="left"
    >
      <div className="px-4 pb-4">
        <div className="grid grid-cols-4 gap-2">
          {months.map((month) => (
            <MonthOption
              key={month}
              month={month}
              selected={selectedMonth === month}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </PickerOverlay>
  )
}

function MonthOption({
  month,
  selected,
  onSelect,
}: {
  month: number
  selected: boolean
  onSelect: (month: number) => void
}) {
  const handleClick = useStableCallback(() => onSelect(month))
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
      {MONTH_NAMES[month - 1]}
    </button>
  )
}
