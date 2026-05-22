"use client"

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
    <PickerOverlay onClose={onClose} closeLabel="Close day picker">
      <div className="px-4 pb-4">
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isSelected = selectedDay === day
            return (
              <button
                type="button"
                key={day}
                onClick={() => onSelect(day)}
                className={`rounded px-2 py-2 text-xs font-medium ${
                  isSelected
                    ? "bg-blue-600 text-white dark:bg-blue-700"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    </PickerOverlay>
  )
}
