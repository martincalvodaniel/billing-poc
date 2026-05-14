"use client"

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
  // Avoid floating-point noise for typical 0.01 steps.
  const rounded = Math.round(next * 1e6) / 1e6
  return String(rounded)
}

interface NumberStepperInputProps {
  id: string
  value: string
  onChange: (next: string) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  required?: boolean
  ariaLabel?: string
  suffix?: string
}

export default function NumberStepperInput({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  required,
  ariaLabel,
  suffix,
}: NumberStepperInputProps) {
  const handleStep = (direction: StepDirection) => {
    onChange(stepValue(value, step, min, max, direction))
  }

  const buttonClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-zinc-200 px-2 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"

  return (
    <div className="flex items-stretch gap-1">
      <button
        type="button"
        onClick={() => handleStep("decrement")}
        disabled={disabled}
        aria-label="Decrease"
        className={buttonClass}
      >
        <span aria-hidden="true">−</span>
      </button>
      <div className="relative flex-1">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          className={`min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-offset-zinc-900${
            suffix ? " pr-10" : ""
          }`}
        />
        {suffix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-zinc-500 dark:text-zinc-400"
          >
            {suffix}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => handleStep("increment")}
        disabled={disabled}
        aria-label="Increase"
        className={buttonClass}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
}
