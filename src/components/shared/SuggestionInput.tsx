"use client"

import type {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react"
import { useCallback, useId, useMemo, useRef, useState } from "react"
import { IconButton } from "@/components/ui/IconButton"
import { CheckIcon } from "@/components/ui/icons/CheckIcon"
import { PencilIcon } from "@/components/ui/icons/PencilIcon"
import { TrashIcon } from "@/components/ui/icons/TrashIcon"
import { useClickOutside } from "@/hooks/useClickOutside"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useStableCallback } from "@/hooks/useStableCallback"

interface SuggestionInputProps {
  label?: string
  ariaLabel: string
  value: string
  options: string[]
  onChange: (value: string) => void
  onSelect: (value: string) => void
  onCreateNew?: (value: string) => void | Promise<void>
  onEditOption?: (value: string) => void
  onDeleteOption?: (value: string) => void
  selectedOption?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  maxLength?: number
  name?: string
  leading?: ReactNode
  createNewLabel?: string
  createNewHint?: string
}

const SEARCH_DEBOUNCE_MS = 300

export default function SuggestionInput({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  onSelect,
  onCreateNew,
  onEditOption,
  onDeleteOption,
  selectedOption,
  placeholder = "Start typing to see suggestions...",
  required = false,
  disabled = false,
  maxLength,
  name,
  leading,
  createNewLabel = "No suggestions found",
  createNewHint = "Press Enter to create a new item.",
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setShowSuggestions(true)
  }

  const handleSelect = useStableCallback((option: string) => {
    onSelect(option)
    setShowSuggestions(false)
  })

  const handleCreateNew = useStableCallback(async () => {
    if (!onCreateNew) return
    try {
      await onCreateNew(value.trim())
    } finally {
      setShowSuggestions(false)
    }
  })

  const handleCreateNewClick = useStableCallback(() => {
    void handleCreateNew()
  })

  const handleMouseDown = (e: ReactMouseEvent<HTMLButtonElement>) =>
    e.preventDefault()

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && showSuggestions) {
        if (
          filteredOptions.length === 0 &&
          value.trim() !== "" &&
          onCreateNew
        ) {
          event.preventDefault()
          void handleCreateNew()
          return
        }
        event.preventDefault()
      }
    },
    [
      filteredOptions.length,
      handleCreateNew,
      onCreateNew,
      showSuggestions,
      value,
    ]
  )

  const handleOutsideClick = useStableCallback(() => {
    setShowSuggestions(false)
  })
  useClickOutside(containerRef, handleOutsideClick, showSuggestions)

  return (
    <div ref={containerRef} className="relative space-y-2">
      {label ? (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          type="text"
          id={id}
          name={name}
          aria-label={ariaLabel}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          required={required}
          disabled={disabled}
          maxLength={maxLength}
        />

        {showSuggestions && !disabled ? (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            {filteredOptions.length > 0 ? (
              <ul className="max-h-60 overflow-y-auto py-1">
                {filteredOptions.map((option) => (
                  <SuggestionItem
                    key={option}
                    label={option}
                    onSelect={handleSelect}
                    onEditOption={onEditOption}
                    onDeleteOption={onDeleteOption}
                    selected={selectedOption === option}
                    leading={leading}
                    onMouseDown={handleMouseDown}
                  />
                ))}
              </ul>
            ) : value.trim() !== "" && onCreateNew ? (
              <button
                type="button"
                onMouseDown={handleMouseDown}
                onClick={handleCreateNewClick}
                className="flex w-full flex-col items-start px-4 py-3 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <span className="font-medium">{createNewLabel}</span>
                <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {createNewHint}
                </span>
              </button>
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
  onEditOption,
  onDeleteOption,
  selected,
  leading,
  onMouseDown,
}: {
  label: string
  onSelect: (value: string) => void
  onEditOption?: (value: string) => void
  onDeleteOption?: (value: string) => void
  selected?: boolean
  leading?: ReactNode
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const handleClick = useStableCallback(() => onSelect(label))
  const handleEditClick = useStableCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      onEditOption?.(label)
    }
  )
  const handleDeleteClick = useStableCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      onDeleteOption?.(label)
    }
  )

  return (
    <li>
      <div
        className={`flex w-full items-center gap-1 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
          selected ? "bg-blue-50 dark:bg-blue-900/20" : ""
        }`}
      >
        <button
          type="button"
          onMouseDown={onMouseDown}
          onClick={handleClick}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {leading}
          <span className="truncate text-zinc-900 dark:text-zinc-100">
            {label}
          </span>
        </button>
        {selected ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            <CheckIcon className="h-3.5 w-3.5" />
            Selected
          </span>
        ) : null}
        {onEditOption ? (
          <IconButton
            onClick={handleEditClick}
            onMouseDown={onMouseDown}
            ariaLabel={`Edit payment template ${label}`}
            variant="neutral"
            size="sm"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </IconButton>
        ) : null}
        {onDeleteOption ? (
          <IconButton
            onClick={handleDeleteClick}
            onMouseDown={onMouseDown}
            ariaLabel={`Delete payment template ${label}`}
            variant="danger"
            size="sm"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </IconButton>
        ) : null}
      </div>
    </li>
  )
}
