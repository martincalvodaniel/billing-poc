"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

interface DebouncedSearchInputProps {
  onSearch: (query: string) => void
  placeholder: string
  ariaLabel: string
  clearAriaLabel: string
  debounceMs?: number
  skipInitialSearch?: boolean
  containerClassName?: string
  inputClassName?: string
}

const DEFAULT_INPUT_CLASS_NAME =
  "w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-offset-zinc-900"

export default function DebouncedSearchInput({
  onSearch,
  placeholder,
  ariaLabel,
  clearAriaLabel,
  debounceMs = 300,
  skipInitialSearch = false,
  containerClassName,
  inputClassName,
}: DebouncedSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedQuery = useDebouncedValue(searchQuery, debounceMs)
  const isInitialMount = useRef(true)
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value)
    },
    []
  )
  const handleClear = useCallback(() => {
    setSearchQuery("")
  }, [])

  useEffect(() => {
    if (skipInitialSearch && isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    isInitialMount.current = false
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch, skipInitialSearch])

  return (
    <div className={containerClassName ?? "relative"}>
      <input
        type="text"
        value={searchQuery}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={inputClassName ?? DEFAULT_INPUT_CLASS_NAME}
      />
      {searchQuery ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label={clearAriaLabel}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}
