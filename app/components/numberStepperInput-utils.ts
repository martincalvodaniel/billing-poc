export type StepDirection = "increment" | "decrement"

/**
 * Pure helper to compute the next value of a numeric stepper input.
 * - When `current` is empty or NaN, falls back to `min` when defined, else 0.
 * - Result is clamped within [min, max] when those bounds are provided.
 * - Returns a string for direct binding to a controlled input.
 */
export function stepValue(
  current: string,
  step: number,
  min: number | undefined,
  max: number | undefined,
  direction: StepDirection
): string {
  const parsed = current === "" ? Number.NaN : Number(current)
  const base = Number.isFinite(parsed) ? parsed : (min ?? 0)
  const delta = direction === "increment" ? step : -step
  let next = base + delta
  if (typeof min === "number" && next < min) next = min
  if (typeof max === "number" && next > max) next = max
  const rounded = Math.round(next * 1e6) / 1e6
  return String(rounded)
}
