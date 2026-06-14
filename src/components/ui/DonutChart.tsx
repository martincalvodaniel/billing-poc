"use client"
import { memo, useMemo, useState } from "react"
import { useStableCallback } from "@/hooks/useStableCallback"
import { computeDonutSegments } from "@/lib/utils/donut-geometry"
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
  const total = useMemo(() => {
    return entries.reduce((sum, [, value]) => {
      return sum + value
    }, 0)
  }, [entries])
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
            <DonutSlice
              key={segment.tag}
              segment={segment}
              dimmed={
                selectedTags.length > 0 && !selectedTags.includes(segment.tag)
              }
              onToggle={onToggleTag}
            />
          ))}
        </svg>

        <div
          className="flex-1 space-y-2 overflow-y-auto"
          style={{ maxHeight: "160px" }}
        >
          {sortedSegments.map((segment) => (
            <DonutLegendItem
              key={segment.tag}
              segment={segment}
              active={selectedTags.includes(segment.tag)}
              filtered={selectedTags.length > 0}
              onToggle={onToggleTag}
            />
          ))}
        </div>
      </div>
    </div>
  )
})
export default DonutChart

type DonutSegment = ReturnType<typeof computeDonutSegments>[number]

function DonutSlice({
  segment,
  dimmed,
  onToggle,
}: {
  segment: DonutSegment
  dimmed: boolean
  onToggle?: (tag: string) => void
}) {
  const handleClick = useStableCallback(() => onToggle?.(segment.tag))
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: donut segments are intentionally clickable filter controls.
    <path
      d={segment.path}
      fill={segment.color}
      onClick={handleClick}
      className={`cursor-pointer transition-opacity hover:opacity-80 ${dimmed ? "opacity-40" : "opacity-100"}`}
    />
  )
}

function DonutLegendItem({
  segment,
  active,
  filtered,
  onToggle,
}: {
  segment: DonutSegment
  active: boolean
  filtered: boolean
  onToggle?: (tag: string) => void
}) {
  const handleClick = useStableCallback(() => onToggle?.(segment.tag))
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      className={`flex w-full items-center justify-between rounded px-1 py-0.5 text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${
        filtered && !active
          ? "opacity-50"
          : "opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: segment.color }}
        />
        <span className="truncate text-zinc-700 dark:text-zinc-300">
          {segment.tag}
        </span>
      </div>
      <span className="ml-2 flex-shrink-0 font-medium text-zinc-900 dark:text-zinc-100">
        {segment.percentage.toFixed(1)}%
      </span>
    </button>
  )
}
