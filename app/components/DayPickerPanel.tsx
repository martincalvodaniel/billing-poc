"use client"
import { useStableCallback } from "@/lib/hooks/useStableCallback"
import PickerOverlay from "./PickerOverlay"

interface DayPickerPanelProps {
  days: number[]
  selectedDay?: number
  onSelect: (day: number) => void
  onClose: () => void
}
export default function DayPickerPanel({
  days,
  selectedDay,
  onSelect,
  onClose,
}: DayPickerPanelProps) {
  return (
    <PickerOverlay
      onClose={onClose}
      closeLabel="Close day picker"
      desktopAlign="left"
    >
      <div className="px-4 pb-4">
        <div className="grid grid-cols-7 gap-1">
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
