"use client"

export type CapacityStatus = "ok" | "full" | "over" | "unbounded"

/**
 * Computes the filled portion of the capacity bar as a percentage in [0, 100].
 * - When `max` is undefined or non-positive → 0 (bar shown grayscale at 0%).
 * - When `used <= max` → (used / max) × 100.
 * - When `used > max` → 100 (overflow uses red color; the bar fills fully).
 */
export function computeFillPercent(
  used: number,
  max: number | undefined
): number {
  if (typeof max !== "number" || !Number.isFinite(max) || max <= 0) return 0
  if (used <= 0) return 0
  const ratio = used / max
  if (ratio >= 1) return 100
  return ratio * 100
}

/**
 * Computes the capacity status:
 *  - "unbounded" when `max` is undefined / non-positive
 *  - "over" when `used > max`
 *  - "full" when `used === max`
 *  - "ok"   otherwise
 */
export function computeStatus(
  used: number,
  max: number | undefined
): CapacityStatus {
  if (typeof max !== "number" || !Number.isFinite(max) || max <= 0)
    return "unbounded"
  if (used > max) return "over"
  if (used === max) return "full"
  return "ok"
}

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
