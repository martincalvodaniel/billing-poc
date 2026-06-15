"use client"

import DebouncedSearchInput from "@/components/ui/DebouncedSearchInput"

interface ProductsSearchProps {
  onSearch: (query: string) => void
}

export default function ProductsSearch({ onSearch }: ProductsSearchProps) {
  return (
    <DebouncedSearchInput
      onSearch={onSearch}
      placeholder="Search products by name..."
      ariaLabel="Search products by name"
      clearAriaLabel="Clear product search"
      skipInitialSearch
      containerClassName="relative min-w-0 w-full lg:w-72 xl:w-80"
      inputClassName="h-11 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-4 pr-10 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-offset-zinc-900"
    />
  )
}
