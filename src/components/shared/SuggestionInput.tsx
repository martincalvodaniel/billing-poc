"use client"

import type { ReactNode } from "react"
import { useCallback, useId, useMemo, useRef, useState } from "react"
import { useClickOutside } from "@/hooks/useClickOutside"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useStableCallback } from "@/hooks/useStableCallback"

interface SuggestionInputProps {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  onSelect: (value: string) => void
  placeholder?: string
  required?: boolean
  name?: string
  leading?: ReactNode
}

const SEARCH_DEBOUNCE_MS = 300

export default function SuggestionInput({
  label,
  value,
  options,
  onChange,
  onSelect,
  placeholder = "Start typing to see suggestions...",
  required = false,
  name,
  leading,
}: SuggestionInputProps) {
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debouncedValue = useDebouncedValue(value, SEARCH_DEBOUNCE_MS)

  const filteredOptions = useMemo(() => {
    const query = debouncedValue.trim().toLowerCase()
    if (query === "") {
      return options
    }
    return options.filter((option) => option.toLowerCase().includes(query))
  }, [debouncedValue, options])

  const handleFocus = () => {
    setShowSuggestions(true)
  }

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setShowSuggestions(true)
  }

  const handleSelect = useStableCallback((option: string) => {
    onSelect(option)
    setShowSuggestions(false)
  })

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) =>
    e.preventDefault()

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && showSuggestions) {
        event.preventDefault()
      }
    },
    [showSuggestions]
  )

  const handleOutsideClick = useStableCallback(() => {
    setShowSuggestions(false)
  })
  useClickOutside(containerRef, handleOutsideClick, showSuggestions)

  return (
    <div ref={containerRef} className="relative space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          required={required}
        />

        {showSuggestions ? (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            {filteredOptions.length > 0 ? (
              <ul className="max-h-60 overflow-y-auto py-1">
                {filteredOptions.map((option) => (
                  <SuggestionItem
                    key={option}
                    label={option}
                    onSelect={handleSelect}
                    leading={leading}
                    onMouseDown={handleMouseDown}
                  />
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                No suggestions found
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SuggestionItem({
  label,
  onSelect,
  leading,
  onMouseDown,
}: {
  label: string
  onSelect: (value: string) => void
  leading?: ReactNode
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const handleClick = useStableCallback(() => onSelect(label))

  return (
    <li>
      <button
        type="button"
        onMouseDown={onMouseDown}
        onClick={handleClick}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
      >
        {leading}
        <span className="truncate text-zinc-900 dark:text-zinc-100">
          {label}
        </span>
      </button>
    </li>
  )
}
