"use client"

import { computeFillPercent, computeStatus } from "./capacityBar-utils"

interface CapacityBarProps {
  used: number
  max?: number
}

export default function CapacityBar({ used, max }: CapacityBarProps) {
  const status = computeStatus(used, max)
  const fillPercent = computeFillPercent(used, max)

  const fillClass =
    status === "over"
      ? "bg-red-600 dark:bg-red-500"
      : status === "unbounded"
        ? "bg-zinc-400 dark:bg-zinc-600"
        : "bg-blue-600 dark:bg-blue-500"

  const ariaValueMax = typeof max === "number" && max > 0 ? max : used
  const safeMax = typeof max === "number" && max > 0 ? max : undefined

  let caption: string
  if (status === "unbounded") {
    caption = `${used} seat${used === 1 ? "" : "s"}`
  } else if (status === "over") {
    const overBy = used - (safeMax ?? 0)
    caption = `${overBy} over capacity`
  } else {
    const remaining = (safeMax ?? 0) - used
    caption = `${remaining} remaining`
  }

  const summary =
    safeMax !== undefined ? `${used} / ${safeMax} seats` : `${used} seats`

  return (
    <div className="space-y-1">
      <div
        role="progressbar"
        aria-label="Event capacity"
        aria-valuemin={0}
        aria-valuemax={ariaValueMax}
        aria-valuenow={used}
        className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <div
          className={`h-full transition-all ${fillClass}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>{summary}</span>
        <span>{caption}</span>
      </div>
    </div>
  )
}
