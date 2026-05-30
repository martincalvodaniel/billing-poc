"use client"

import { memo, useMemo, useState } from "react"
import { computeDonutSegments } from "@/lib/donut-geometry"
import DonutSortControls, {
  type DonutSortBy,
  type DonutSortOrder,
} from "./DonutSortControls"

interface DonutChartProps {
  data: Record<string, number>
  title: string
  colors: string[]
  selectedTags?: string[]
  onToggleTag?: (tag: string) => void
}

const DonutChart = memo(function DonutChart({
  data,
  title,
  colors,
  selectedTags = [],
  onToggleTag,
}: DonutChartProps) {
  const [sortBy, setSortBy] = useState<DonutSortBy>("percentage")
  const [sortOrder, setSortOrder] = useState<DonutSortOrder>("desc")

  const entries = useMemo(() => Object.entries(data), [data])
  const total = useMemo(
    () => entries.reduce((sum, [, value]) => sum + value, 0),
    [entries]
  )

  // Stable color mapping preserves color → tag across reorderings of the legend.
  const colorMap = useMemo(() => {
    const map = new Map<string, string>()
    entries.forEach(([tag], index) => {
      map.set(tag, colors[index % colors.length])
    })
    return map
  }, [entries, colors])

  const segments = useMemo(
    () => computeDonutSegments({ entries, total, colorMap, colors }),
    [entries, total, colorMap, colors]
  )

  // Sorted view drives only the legend; SVG slice order is preserved.
  const sortedSegments = useMemo(() => {
    const sorted = [...segments]
    if (sortBy === "percentage") {
      sorted.sort((a, b) =>
        sortOrder === "desc"
          ? b.percentage - a.percentage
          : a.percentage - b.percentage
      )
    } else {
      sorted.sort((a, b) => {
        const comparison = a.tag.localeCompare(b.tag)
        return sortOrder === "desc" ? -comparison : comparison
      })
    }
    return sorted
  }, [segments, sortBy, sortOrder])

  const toggleSortBy = (newSortBy: DonutSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc")
    } else {
      setSortBy(newSortBy)
      setSortOrder("desc")
    }
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-start rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {title}
        </p>
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-500">
          No data
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {title}
        </p>
        <DonutSortControls
          sortBy={sortBy}
          sortOrder={sortOrder}
          onToggle={toggleSortBy}
        />
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <svg
          viewBox="0 0 120 120"
          className="h-32 w-32 flex-shrink-0 sm:h-40 sm:w-40"
          aria-hidden="true"
        >
          {segments.map((segment) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: donut segments are intentionally clickable filter controls.
            <path
              key={segment.tag}
              d={segment.path}
              fill={segment.color}
              onClick={() => onToggleTag?.(segment.tag)}
              className={`cursor-pointer transition-opacity hover:opacity-80 ${
                selectedTags.length > 0 && !selectedTags.includes(segment.tag)
                  ? "opacity-40"
                  : "opacity-100"
              }`}
            />
          ))}
        </svg>

        <div
          className="flex-1 space-y-2 overflow-y-auto"
          style={{ maxHeight: "160px" }}
        >
          {sortedSegments.map((segment) => {
            const active = selectedTags.includes(segment.tag)
            const dimmed = selectedTags.length > 0 && !active
            return (
              <button
                key={segment.tag}
                type="button"
                onClick={() => onToggleTag?.(segment.tag)}
                aria-pressed={active}
                className={`flex w-full items-center justify-between rounded px-1 py-0.5 text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  dimmed
                    ? "opacity-50"
                    : "opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <span className="truncate text-zinc-700 dark:text-zinc-300">
                    {segment.tag}
                  </span>
                </div>
                <span className="ml-2 flex-shrink-0 font-medium text-zinc-900 dark:text-zinc-100">
                  {segment.percentage.toFixed(1)}%
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default DonutChart
