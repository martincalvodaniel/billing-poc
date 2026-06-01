import type { ReactNode } from "react"

const DEFAULT_WEEKDAY_HEADERS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const

interface MonthCalendarGridProps<TCell extends { key: string }> {
  cells: readonly TCell[]
  renderCell: (cell: TCell) => ReactNode
  weekdayHeaders?: readonly string[]
}

export default function MonthCalendarGrid<TCell extends { key: string }>({
  cells,
  renderCell,
  weekdayHeaders = DEFAULT_WEEKDAY_HEADERS,
}: MonthCalendarGridProps<TCell>) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekdayHeaders.map((label) => (
          <div
            key={label}
            className="px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => renderCell(cell))}
      </div>
    </div>
  )
}
