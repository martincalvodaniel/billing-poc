"use client"

import { useEffect, useRef, useState } from "react"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

interface ProductsSearchProps {
  onSearch: (query: string) => void
}

export default function ProductsSearch({ onSearch }: ProductsSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedQuery = useDebouncedValue(searchQuery, 300)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  const handleClear = () => setSearchQuery("")
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchQuery(e.target.value)

  return (
    <div className="relative w-full lg:w-72 xl:w-80">
      <input
        type="text"
        value={searchQuery}
        onChange={handleChange}
        placeholder="Search products by name..."
        className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-offset-zinc-900"
      />
      {searchQuery ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear product search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}
