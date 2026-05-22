"use client"

import { useEffect, useRef, useState } from "react"
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue"

interface ClientSearchProps {
  onSearch: (query: string) => void
}

export default function ClientSearch({ onSearch }: ClientSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedQuery = useDebouncedValue(searchQuery, 300)
  const isInitialMount = useRef(true)

  // Skip the initial mount to avoid duplicate API call (parent handles
  // initial data fetch). Subsequent debounced values trigger onSearch.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search clients by name or tax ID..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-offset-zinc-900"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
}
