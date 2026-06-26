"use client"

import type { ChangeEvent, KeyboardEvent, ReactNode } from "react"
import { useEffect, useId, useRef, useState } from "react"
import RequiredAsterisk from "@/components/ui/RequiredAsterisk"
import { useClickOutside } from "@/hooks/useClickOutside"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useStableCallback } from "@/hooks/useStableCallback"

interface ClientQueryInputProps {
  value: string
  onChange: (value: string) => void
  onDebouncedChange?: (value: string) => void
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void | Promise<void>
  label?: string
  required?: boolean
  placeholder?: string
  ariaLabel: string
  clearAriaLabel?: string
  debounceMs?: number
  skipInitialDebouncedChange?: boolean
  rightAdornment?: ReactNode
  renderDropdown?: (controls: {
    closeDropdown: () => void
    trimmedValue: string
  }) => ReactNode
}

const DEFAULT_DEBOUNCE_MS = 300
const DEFAULT_INPUT_CLASS_NAME =
  "w-full rounded-md border border-zinc-300 bg-white py-2 pl-4 pr-16 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"

export default function ClientQueryInput({
  value,
  onChange,
  onDebouncedChange,
  onKeyDown,
  label,
  required = false,
  placeholder = "Search clients by name or tax ID...",
  ariaLabel,
  clearAriaLabel = "Clear client search",
  debounceMs = DEFAULT_DEBOUNCE_MS,
  skipInitialDebouncedChange = false,
  rightAdornment,
  renderDropdown,
}: ClientQueryInputProps) {
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const debouncedValue = useDebouncedValue(value, debounceMs)
  const trimmedValue = value.trim()

  useEffect(() => {
    if (!onDebouncedChange) return
    if (skipInitialDebouncedChange && isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    isInitialMount.current = false
    onDebouncedChange(debouncedValue)
  }, [debouncedValue, onDebouncedChange, skipInitialDebouncedChange])

  const closeDropdown = () => {
    setShowDropdown(false)
  }

  const handleFocus = () => {
    if (renderDropdown) {
      setShowDropdown(true)
    }
  }

  const handleBlur = () => {
    if (!renderDropdown) return
    setTimeout(() => {
      setShowDropdown(false)
    }, 200)
  }

  const handleClear = () => {
    onChange("")
    closeDropdown()
  }
  const handleInputChange = useStableCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value)
      if (renderDropdown) {
        setShowDropdown(true)
      }
    }
  )

  useClickOutside(containerRef, closeDropdown, showDropdown)

  return (
    <div ref={containerRef} className="relative space-y-2">
      {label ? (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
          {required ? <RequiredAsterisk /> : null}
        </label>
      ) : null}

      <div className="relative">
        <input
          type="text"
          id={id}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={DEFAULT_INPUT_CLASS_NAME}
          required={required}
        />

        {value || rightAdornment ? (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {rightAdornment}
            {value ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                aria-label={clearAriaLabel}
              >
                ✕
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {showDropdown && renderDropdown
        ? renderDropdown({ closeDropdown, trimmedValue })
        : null}
    </div>
  )
}
