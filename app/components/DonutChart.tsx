"use client"

import { memo, useMemo, useState } from "react"

interface DonutChartProps {
  data: Record<string, number>
  title: string
  colors: string[]
}

type SortBy = "percentage" | "name"
type SortOrder = "asc" | "desc"

const DonutChart = memo(function DonutChart({
  data,
  title,
  colors,
}: DonutChartProps) {
  const [sortBy, setSortBy] = useState<SortBy>("percentage")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const entries = useMemo(() => Object.entries(data), [data])
  const total = useMemo(
    () => entries.reduce((sum, [, value]) => sum + value, 0),
    [entries]
  )

  // Create stable color mapping based on original order to maintain consistent colors
  const colorMap = useMemo(() => {
    const map = new Map<string, string>()
    entries.forEach(([tag], index) => {
      map.set(tag, colors[index % colors.length])
    })
    return map
  }, [entries, colors])

  // Calculate segments for SVG rendering (memoized, independent of sorting)
  const segments = useMemo(() => {
    const centerX = 60
    const centerY = 60
    const outerRadius = 45
    const innerRadius = 30
    let currentAngle = -90 // Start from top
    const result: Array<{
      tag: string
      percentage: number
      color: string
      path: string
    }> = []

    entries.forEach(([tag, value]) => {
      const percentage = (value / total) * 100
      const sliceAngle = (percentage / 100) * 360
      const color = colorMap.get(tag) || colors[0]

      if (sliceAngle === 360) {
        // Handle full circle case - draw as two semicircles
        const startRad = (-90 * Math.PI) / 180
        const midRad = (90 * Math.PI) / 180
        const endRad = (270 * Math.PI) / 180

        // First semicircle (outer)
        const x1 = centerX + outerRadius * Math.cos(startRad)
        const y1 = centerY + outerRadius * Math.sin(startRad)
        const x2 = centerX + outerRadius * Math.cos(midRad)
        const y2 = centerY + outerRadius * Math.sin(midRad)
        const x3 = centerX + outerRadius * Math.cos(endRad)
        const y3 = centerY + outerRadius * Math.sin(endRad)

        // Inner semicircles
        const x4 = centerX + innerRadius * Math.cos(endRad)
        const y4 = centerY + innerRadius * Math.sin(endRad)
        const x5 = centerX + innerRadius * Math.cos(midRad)
        const y5 = centerY + innerRadius * Math.sin(midRad)
        const x6 = centerX + innerRadius * Math.cos(startRad)
        const y6 = centerY + innerRadius * Math.sin(startRad)

        const pathData = `
          M ${x1} ${y1}
          A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2}
          A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3}
          L ${x4} ${y4}
          A ${innerRadius} ${innerRadius} 0 0 0 ${x5} ${y5}
          A ${innerRadius} ${innerRadius} 0 0 0 ${x6} ${y6}
          Z
        `

        result.push({
          tag,
          percentage,
          color,
          path: pathData,
        })
      } else {
        const endAngle = currentAngle + sliceAngle

        // Convert angles to radians
        const startRad = (currentAngle * Math.PI) / 180
        const endRad = (endAngle * Math.PI) / 180

        // Calculate outer arc points
        const x1 = centerX + outerRadius * Math.cos(startRad)
        const y1 = centerY + outerRadius * Math.sin(startRad)
        const x2 = centerX + outerRadius * Math.cos(endRad)
        const y2 = centerY + outerRadius * Math.sin(endRad)

        // Calculate inner arc points
        const x3 = centerX + innerRadius * Math.cos(endRad)
        const y3 = centerY + innerRadius * Math.sin(endRad)
        const x4 = centerX + innerRadius * Math.cos(startRad)
        const y4 = centerY + innerRadius * Math.sin(startRad)

        const largeArc = sliceAngle > 180 ? 1 : 0

        // Create path
        const pathData = `
          M ${x1} ${y1}
          A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
          L ${x3} ${y3}
          A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
          Z
        `

        result.push({
          tag,
          percentage,
          color,
          path: pathData,
        })

        currentAngle = endAngle
      }
    })

    return result
  }, [entries, total, colorMap, colors])

  // Sort segments for legend display only (does not affect SVG rendering)
  const sortedSegments = useMemo(() => {
    const sorted = [...segments]

    if (sortBy === "percentage") {
      sorted.sort((a, b) => {
        return sortOrder === "desc"
          ? b.percentage - a.percentage
          : a.percentage - b.percentage
      })
    } else {
      // Sort by name
      sorted.sort((a, b) => {
        const comparison = a.tag.localeCompare(b.tag)
        return sortOrder === "desc" ? -comparison : comparison
      })
    }

    return sorted
  }, [segments, sortBy, sortOrder])

  const toggleSortBy = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      // Toggle order if clicking the same sort option
      setSortOrder(sortOrder === "desc" ? "asc" : "desc")
    } else {
      // Switch to new sort option with descending as default
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
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => toggleSortBy("percentage")}
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
            onClick={() => toggleSortBy("name")}
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
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <svg
          viewBox="0 0 120 120"
          className="h-32 w-32 flex-shrink-0 sm:h-40 sm:w-40"
          aria-hidden="true"
        >
          {segments.map((segment) => (
            <path
              key={segment.tag}
              d={segment.path}
              fill={segment.color}
              className="hover:opacity-80 transition-opacity"
            />
          ))}
        </svg>

        <div
          className="flex-1 space-y-2 overflow-y-auto"
          style={{ maxHeight: "160px" }}
        >
          {sortedSegments.map((segment) => (
            <div
              key={segment.tag}
              className="flex items-center justify-between text-xs"
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
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default DonutChart
