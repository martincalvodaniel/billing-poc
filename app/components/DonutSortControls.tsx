"use client"

export type DonutSortBy = "percentage" | "name"
export type DonutSortOrder = "asc" | "desc"

interface DonutSortControlsProps {
  sortBy: DonutSortBy
  sortOrder: DonutSortOrder
  onToggle: (next: DonutSortBy) => void
}

export default function DonutSortControls({
  sortBy,
  sortOrder,
  onToggle,
}: DonutSortControlsProps) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onToggle("percentage")}
        aria-label={`Sort by percentage ${sortBy === "percentage" ? (sortOrder === "desc" ? "descending" : "ascending") : ""}`}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
          sortBy === "percentage"
            ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        }`}
      >
        % {sortBy === "percentage" && (sortOrder === "desc" ? "↓" : "↑")}
      </button>
      <button
        type="button"
        onClick={() => onToggle("name")}
        aria-label={`Sort by name ${sortBy === "name" ? (sortOrder === "desc" ? "descending" : "ascending") : ""}`}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
          sortBy === "name"
            ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        }`}
      >
        AZ {sortBy === "name" && (sortOrder === "desc" ? "↓" : "↑")}
      </button>
    </div>
  )
}
