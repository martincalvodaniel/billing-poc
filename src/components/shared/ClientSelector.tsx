"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import ClientQueryInput from "@/components/shared/ClientQueryInput"
import { useClients } from "@/features/clients/hooks/useClients"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useStableCallback } from "@/hooks/useStableCallback"
import { fetcher } from "@/lib/client/swr-fetcher"
import type { Client } from "@/lib/domain/entities/client"
import { ClientTypeIcon } from "../ui/icons/ClientTypeIcon"
import { PencilIcon } from "../ui/icons/PencilIcon"

interface ClientSelectorProps {
  value?: string // Client ID
  initialQuery?: string
  selectedClientName?: string
  onChange: (
    clientId: string | undefined,
    clientName: string | undefined
  ) => void
  onSelectClient?: (client: Client | null) => void
  label?: string
  required?: boolean
  onCreateClient?: (name: string) => void | Promise<void>
  isCreating?: boolean
  onEditClient?: (client: Client) => void
}

const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE = 20

export default function ClientSelector({
  value,
  initialQuery,
  selectedClientName,
  onChange,
  onSelectClient,
  label = "Client (Optional)",
  required = false,
  onCreateClient,
  isCreating = false,
  onEditClient,
}: ClientSelectorProps) {
  function handleEditClient() {
    if (onEditClient && selectedClient) {
      onEditClient(selectedClient)
    }
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [manuallySelectedId, setManuallySelectedId] = useState<string | null>(
    null
  )
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
  const shouldFetchSelectedById = useMemo(() => {
    if (!value) return false
    return !clients.some((client) => client._id === value)
  }, [value, clients])
  const { data: selectedClientById } = useSWR<Client>(
    shouldFetchSelectedById && value
      ? (["/api/clients/by-id", value] as const)
      : null,
    ([, clientId]) => fetcher<Client>(`/api/clients/${clientId}`)
  )
  // Derive the currently selected client from the cached list. When the
  // user has just made a manual selection we honour it; otherwise we
  // resolve from `value` against the cached results.
  const selectedClient = useMemo<Client | null>(() => {
    if (!value) return null
    if (manuallySelectedId === value) {
      return clients.find((c) => c._id === value) ?? selectedClientById ?? null
    }
    return clients.find((c) => c._id === value) ?? selectedClientById ?? null
  }, [value, clients, manuallySelectedId, selectedClientById])
  // Sync the search input with the resolved selected client's name.
  // We only seed the input on (a) clearing the value externally, or
  // (b) the first time the selected client resolves for the current value.
  const resolvedNameRef = useRef<string | null>(null)
  const appliedInitialQueryRef = useRef<string | null>(null)
  useEffect(() => {
    if (!value) {
      resolvedNameRef.current = null
      setSearchQuery((q) => (q === "" ? q : ""))
      return
    }
    const resolvedName =
      selectedClient?.name ?? selectedClientName?.trim() ?? ""
    if (resolvedName.length > 0 && resolvedNameRef.current !== value) {
      resolvedNameRef.current = value
      setSearchQuery(resolvedName)
    }
  }, [value, selectedClient, selectedClientName])
  useEffect(() => {
    if (value) return
    const nextQuery = initialQuery?.trim() ?? ""
    if (nextQuery.length === 0) {
      appliedInitialQueryRef.current = null
      return
    }
    if (appliedInitialQueryRef.current === nextQuery) return
    appliedInitialQueryRef.current = nextQuery
    setSearchQuery(nextQuery)
  }, [initialQuery, value])
  const updateSearchQuery = (next: string) => {
    setSearchQuery(next)
    // Clear selection if user is typing
    if (value) {
      setManuallySelectedId(null)
      resolvedNameRef.current = null
      onChange(undefined, undefined)
      onSelectClient?.(null)
    }
  }
  const trimmed = searchQuery.trim()
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
    []
  )
  const handleCreateClient = useCallback(() => {
    if (onCreateClient) {
      void onCreateClient(trimmed)
    }
  }, [onCreateClient, trimmed])
  const handleClientSelect = useCallback(
    (client: Client) => {
      const clientId = client._id
      setManuallySelectedId(clientId ?? null)
      resolvedNameRef.current = clientId ?? null
      setSearchQuery(client.name)
      onChange(clientId, client.name)
      onSelectClient?.(client)
    },
    [onChange, onSelectClient]
  )
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
  const renderDropdown = useCallback(
    ({
      closeDropdown,
      trimmedValue,
    }: {
      closeDropdown: () => void
      trimmedValue: string
    }) => (
      <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
        {isLoading ? (
          <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
            Loading...
          </div>
        ) : clients.length > 0 ? (
          <ul className="max-h-60 overflow-y-auto py-1">
            {clients.map((client) => (
              <ClientSuggestion
                key={client._id}
                client={client}
                closeDropdown={closeDropdown}
                onSelect={handleClientSelect}
              />
            ))}
          </ul>
        ) : trimmedValue !== "" ? (
          canCreateInline && onCreateClient ? (
            <button
              type="button"
              onMouseDown={handleMouseDown}
              onClick={handleCreateClient}
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
    ),
    [
      canCreateInline,
      clients,
      handleClientSelect,
      handleCreateClient,
      handleMouseDown,
      isCreating,
      isLoading,
      onCreateClient,
    ]
  )
  return (
    <ClientQueryInput
      value={searchQuery}
      onChange={updateSearchQuery}
      onKeyDown={handleInputKeyDown}
      label={label}
      required={required}
      ariaLabel="Search clients by name or tax ID"
      clearAriaLabel="Clear selection"
      rightAdornment={
        selectedClient && onEditClient ? (
          <button
            type="button"
            onClick={handleEditClient}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Edit selected client"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        ) : null
      }
      renderDropdown={renderDropdown}
    />
  )
}
function ClientSuggestion({
  client,
  closeDropdown,
  onSelect,
}: {
  client: Client
  closeDropdown: () => void
  onSelect: (client: Client) => void
}) {
  const handleClick = useStableCallback(() => {
    onSelect(client)
    closeDropdown()
  })
  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
      >
        <ClientTypeIcon
          type={client.clientType}
          className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
        />
        <div className="min-w-0">
          <span className="block truncate text-zinc-900 dark:text-zinc-100">
            {client.name}
          </span>
          {client.taxId ? (
            <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
              {client.taxId}
            </span>
          ) : null}
        </div>
      </button>
    </li>
  )
}
