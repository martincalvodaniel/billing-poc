interface RadioPillOption<T extends string> {
  value: T
  label: string
  dotClass?: string
  ringClass: string
}

interface RadioPillGroupProps<T extends string> {
  legend: string
  name: string
  idPrefix: string
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  options: RadioPillOption<T>[]
  required?: boolean
}

export default function RadioPillGroup<T extends string>({
  legend,
  name,
  idPrefix,
  value,
  onChange,
  disabled,
  options,
  required,
}: RadioPillGroupProps<T>) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {legend}
      </legend>
      <div className="flex gap-4">
        {options.map((option) => (
          <RadioPill
            key={option.value}
            option={option}
            inputId={`${idPrefix}-${option.value}`}
            name={name}
            checked={value === option.value}
            required={required}
            onChange={onChange}
          />
        ))}
      </div>
    </fieldset>
  )
}

function RadioPill<T extends string>({
  option,
  inputId,
  name,
  checked,
  required,
  onChange,
}: {
  option: RadioPillOption<T>
  inputId: string
  name: string
  checked: boolean
  required?: boolean
  onChange: (value: T) => void
}) {
  const handleChange = useStableCallback(() => onChange(option.value))

  return (
    <label
      htmlFor={inputId}
      className="inline-flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100"
    >
      <input
        type="radio"
        id={inputId}
        name={name}
        value={option.value}
        checked={checked}
        onChange={handleChange}
        required={required}
        className={`h-4 w-4 border-zinc-300 ${option.ringClass} dark:border-zinc-600 dark:bg-zinc-800`}
      />
      {option.dotClass ? (
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`inline-block h-2 w-2 rounded-full ${option.dotClass}`}
          />
          {option.label}
        </span>
      ) : (
        <span>{option.label}</span>
      )}
    </label>
  )
}

import { useStableCallback } from "@/hooks/useStableCallback"
