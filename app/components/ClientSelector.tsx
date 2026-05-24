"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { ClientTypeIcon } from "@/app/components/icons/ClientTypeIcon"
import { useClickOutside } from "@/lib/hooks/useClickOutside"
import { useClients } from "@/lib/hooks/useClients"
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue"
import type { Client } from "@/lib/types"

interface ClientSelectorProps {
  value?: string // Client ID
  onChange: (
    clientId: string | undefined,
    clientName: string | undefined
  ) => void
  label?: string
  required?: boolean
  onCreateClient?: (name: string) => void | Promise<void>
  isCreating?: boolean
}

const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE = 20

export default function ClientSelector({
  value,
  onChange,
  label = "Client (Optional)",
  required = false,
  onCreateClient,
  isCreating = false,
}: ClientSelectorProps) {
  const id = useId()
  const [searchQuery, setSearchQuery] = useState("")
  const [manuallySelectedId, setManuallySelectedId] = useState<string | null>(
    null
  )
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS)

  // Single SWR-backed clients query: powers both the suggestions dropdown
  // and the by-id lookup fallback for a pre-selected `value`. Replaces the
  // previous two effects (lookup-by-id + debounced search fetch) which were
  // a root cause of duplicate `/api/clients` calls.
  const { clients, isLoading } = useClients({
    search: debouncedSearch,
    page: 1,
    pageSize: PAGE_SIZE,
  })

  // Derive the currently selected client from the cached list. When the
  // user has just made a manual selection we honour it; otherwise we
  // resolve from `value` against the cached results.
  const selectedClient = useMemo<Client | null>(() => {
    if (!value) return null
    if (manuallySelectedId === value) {
      return clients.find((c) => c._id?.toString() === value) ?? null
    }
    return clients.find((c) => c._id?.toString() === value) ?? null
  }, [value, clients, manuallySelectedId])

  // Sync the search input with the resolved selected client's name.
  // We only seed the input on (a) clearing the value externally, or
  // (b) the first time the selected client resolves for the current value.
  const resolvedNameRef = useRef<string | null>(null)
  useEffect(() => {
    if (!value) {
      resolvedNameRef.current = null
      setSearchQuery((q) => (q === "" ? q : ""))
      return
    }
    if (selectedClient && resolvedNameRef.current !== value) {
      resolvedNameRef.current = value
      setSearchQuery(selectedClient.name)
    }
  }, [value, selectedClient])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setSearchQuery(next)
    setShowSuggestions(true)

    // Clear selection if user is typing
    if (selectedClient) {
      setManuallySelectedId(null)
      resolvedNameRef.current = null
      onChange(undefined, undefined)
    }
  }

  const handleClientSelect = (client: Client) => {
    const clientId = client._id?.toString()
    setManuallySelectedId(clientId ?? null)
    resolvedNameRef.current = clientId ?? null
    setSearchQuery(client.name)
    setShowSuggestions(false)
    onChange(clientId, client.name)
  }

  const handleClearSelection = () => {
    setManuallySelectedId(null)
    resolvedNameRef.current = null
    setSearchQuery("")
    onChange(undefined, undefined)
  }

  const handleInputFocus = () => {
    setShowSuggestions(true)
  }

  const handleInputBlur = () => {
    // Delay closing to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  const trimmed = searchQuery.trim()
  const noMatches = !isLoading && clients.length === 0 && trimmed !== ""
  const canCreateInline = noMatches && Boolean(onCreateClient)

  const handleInputKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Enter" &&
      canCreateInline &&
      !isCreating &&
      onCreateClient
    ) {
      event.preventDefault()
      await onCreateClient(trimmed)
    }
  }

  // Close suggestions when clicking outside
  const handleOutsideClick = useCallback(() => {
    setShowSuggestions(false)
  }, [])
  useClickOutside(containerRef, handleOutsideClick)

  return (
    <div ref={containerRef} className="relative space-y-2">
      <label
        htmlFor={`${id}-client-selector`}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>

      <div className="relative">
        <input
          type="text"
          id={`${id}-client-selector`}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder="Search clients by name or tax ID..."
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          required={required}
        />

        {/* Clear button */}
        {(searchQuery || selectedClient) && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Clear selection"
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              Loading...
            </div>
          ) : clients.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto py-1">
              {clients.map((client) => (
                <li key={client._id?.toString()}>
                  <button
                    type="button"
                    onClick={() => handleClientSelect(client)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <ClientTypeIcon
                      type={client.clientType}
                      className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
                    />
                    <span className="truncate text-zinc-900 dark:text-zinc-100">
                      {client.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : searchQuery.trim() !== "" ? (
            canCreateInline && onCreateClient ? (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onCreateClient(trimmed)}
                disabled={isCreating}
                className="flex w-full items-center px-4 py-3 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {isCreating
                  ? "Creating…"
                  : "No clients found. Press Enter to create a new client."}
              </button>
            ) : (
              <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                No clients found
              </div>
            )
          ) : (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              Start typing to search
            </div>
          )}
        </div>
      )}
    </div>
  )
}
