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
