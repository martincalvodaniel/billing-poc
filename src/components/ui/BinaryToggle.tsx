import type { ReactNode } from "react"

export type BinaryToggleValue = "left" | "right"

interface BinaryToggleProps {
  value: BinaryToggleValue
  leftLabel: string
  rightLabel: string
  ariaLabel: string
  onChange: (value: BinaryToggleValue) => void
  leading?: ReactNode
  className?: string
  leftIndicatorClassName?: string
  rightIndicatorClassName?: string
  leftSelectedTextClassName?: string
  rightSelectedTextClassName?: string
}

export default function BinaryToggle({
  value,
  leftLabel,
  rightLabel,
  ariaLabel,
  onChange,
  leading,
  className = "",
  leftIndicatorClassName = "bg-blue-600 dark:bg-blue-700",
  rightIndicatorClassName = "bg-blue-600 dark:bg-blue-700",
  leftSelectedTextClassName = "text-white",
  rightSelectedTextClassName = "text-white",
}: BinaryToggleProps) {
  const selectLeft = () => onChange("left")
  const selectRight = () => onChange("right")

  return (
    <fieldset
      className={`inline-flex h-11 overflow-hidden rounded-lg border border-zinc-300 bg-zinc-100 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-within:ring-offset-zinc-900 ${className}`}
      aria-label={ariaLabel}
    >
      <legend className="sr-only">{ariaLabel}</legend>
      {leading ? (
        <span
          className="flex h-full items-center px-2 text-sm"
          aria-hidden="true"
        >
          {leading}
        </span>
      ) : null}
      <div className="relative grid min-w-0 flex-1 grid-cols-2">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 transition-[transform,background-color] duration-200 ease-out ${
            value === "right" ? "translate-x-full" : "translate-x-0"
          } ${
            value === "left" ? leftIndicatorClassName : rightIndicatorClassName
          }`}
        />
        <button
          type="button"
          onClick={selectLeft}
          aria-pressed={value === "left"}
          className={`relative z-10 min-w-0 px-3 py-2 text-sm font-medium transition-colors focus:outline-none ${
            value === "left"
              ? leftSelectedTextClassName
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          }`}
        >
          {leftLabel}
        </button>
        <button
          type="button"
          onClick={selectRight}
          aria-pressed={value === "right"}
          className={`relative z-10 min-w-0 px-3 py-2 text-sm font-medium transition-colors focus:outline-none ${
            value === "right"
              ? rightSelectedTextClassName
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          }`}
        >
          {rightLabel}
        </button>
      </div>
    </fieldset>
  )
}
