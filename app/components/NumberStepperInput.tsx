"use client"

import { type StepDirection, stepValue } from "./numberStepperInput-utils"

interface NumberStepperInputProps {
  id: string
  value: string
  onValueChange: (value: string) => void
  ariaLabel: string
  min?: number
  max?: number
  step: number
  disabled?: boolean
  required?: boolean
}

export default function NumberStepperInput({
  id,
  value,
  onValueChange,
  ariaLabel,
  min,
  max,
  step,
  disabled,
  required,
}: NumberStepperInputProps) {
  const parsedValue = value === "" ? Number.NaN : Number(value)
  const decrementDisabled =
    disabled || (typeof min === "number" && parsedValue <= min)
  const incrementDisabled =
    disabled || (typeof max === "number" && parsedValue >= max)

  const handleStep = (direction: StepDirection) => {
    const nextValue = stepValue(value, step, min, max, direction)
    onValueChange(nextValue)
  }
  const handleDecrement = () => handleStep("decrement")
  const handleIncrement = () => handleStep("increment")
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(event.target.value)
  }

  const buttonClass =
    "flex h-11 w-10 shrink-0 items-center justify-center bg-zinc-50 text-lg font-medium text-zinc-700 transition hover:bg-zinc-100 focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"

  return (
    <div className="flex min-w-0 overflow-hidden rounded-md border border-zinc-300 bg-white shadow-sm focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={decrementDisabled}
        aria-label={`Decrease ${ariaLabel}`}
        className={`${buttonClass} border-r border-zinc-300 dark:border-zinc-700`}
      >
        <span aria-hidden="true">−</span>
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
        className="h-11 min-w-0 flex-1 appearance-none bg-white px-1 text-center text-sm text-zinc-900 focus:outline-none disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={incrementDisabled}
        aria-label={`Increase ${ariaLabel}`}
        className={`${buttonClass} border-l border-zinc-300 dark:border-zinc-700`}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
}
