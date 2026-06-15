"use client"

import DebouncedSearchInput from "@/components/ui/DebouncedSearchInput"

interface ClientSearchProps {
  onSearch: (query: string) => void
}

export default function ClientSearch({ onSearch }: ClientSearchProps) {
  return (
    <DebouncedSearchInput
      onSearch={onSearch}
      placeholder="Search clients by name or tax ID..."
      ariaLabel="Search clients by name or tax ID"
      clearAriaLabel="Clear search"
      skipInitialSearch
    />
  )
}
