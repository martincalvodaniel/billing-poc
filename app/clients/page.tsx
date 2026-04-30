"use client"

import { useCallback, useState } from "react"
import PageLayout from "@/app/components/PageLayout"
import { useCreateClient } from "@/lib/hooks/useClientMutations"
import { useClients } from "@/lib/hooks/useClients"
import { FetchError } from "@/lib/swr-fetcher"
import type { ClientFormData } from "@/lib/types"
import ClientForm from "./components/ClientForm"
import ClientList from "./components/ClientList"
import ClientSearch from "./components/ClientSearch"
import PaginationControls from "./components/PaginationControls"

const PAGE_SIZE = 10

function extractApiError(err: unknown, fallback: string): string {
  if (
    err instanceof FetchError &&
    err.info &&
    typeof err.info === "object" &&
    "error" in err.info &&
    typeof (err.info as { error: unknown }).error === "string"
  ) {
    return (err.info as { error: string }).error
  }
  if (err instanceof Error) {
    return err.message
  }
  return fallback
}

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)

  const {
    data,
    clients,
    isLoading,
    error: fetchError,
  } = useClients({ search: searchQuery, page, pageSize: PAGE_SIZE })

  const { trigger: createClient } = useCreateClient()

  const pagination = data?.pagination

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setPage(1) // Reset to page 1 on search
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleCreateClient = async (formData: ClientFormData) => {
    try {
      await createClient(formData)
    } catch (err) {
      throw new Error(extractApiError(err, "Failed to create client"))
    }
    setShowForm(false)
    setPage(1) // Reset to page 1 after create
  }

  const errorMessage =
    fetchError instanceof Error
      ? fetchError.message
      : fetchError
        ? "Failed to fetch clients"
        : null

  return (
    <PageLayout navigationSubtitle="Clients">
      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <ClientSearch onSearch={handleSearch} />
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            {showForm ? "Cancel" : "Add Client"}
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Create New Client
            </h3>
            <ClientForm
              onSubmit={handleCreateClient}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
      </div>

      {isLoading && clients.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-zinc-600 dark:text-zinc-400">Loading clients...</p>
        </div>
      ) : (
        <>
          <ClientList clients={clients} />

          {pagination && pagination.total > 0 && (
            <div className="flex justify-center">
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                pageSize={pagination.pageSize}
                hasPrevPage={pagination.hasPrevPage}
                hasNextPage={pagination.hasNextPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
