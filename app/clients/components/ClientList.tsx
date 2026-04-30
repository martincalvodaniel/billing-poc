"use client"

import { useCallback, useEffect, useState } from "react"
import Modal from "@/app/components/Modal"
import {
  useDeleteClient,
  useUpdateClient,
} from "@/lib/hooks/useClientMutations"
import { FetchError } from "@/lib/swr-fetcher"
import type { Client, ClientFormData } from "@/lib/types"
import ClientForm from "./ClientForm"

interface ClientListProps {
  clients: Client[]
}

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

export default function ClientList({ clients }: ClientListProps) {
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { trigger: updateClient } = useUpdateClient()
  const { trigger: deleteClient, isMutating: isDeleting } = useDeleteClient()

  const handleEdit = (clientId: string) => {
    setEditingClientId(clientId)
    setError(null)
  }

  const handleCancelEdit = useCallback(() => {
    setEditingClientId(null)
    setError(null)
  }, [])

  const handleUpdate = async (data: ClientFormData) => {
    if (!editingClientId) return
    try {
      await updateClient({ id: editingClientId, ...data })
    } catch (err) {
      throw new Error(extractApiError(err, "Failed to update client"))
    }
    setEditingClientId(null)
  }

  const handleDeleteClick = (clientId: string) => {
    setDeletingClientId(clientId)
    setError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingClientId) return
    try {
      await deleteClient({ id: deletingClientId })
      setDeletingClientId(null)
    } catch (err) {
      setError(extractApiError(err, "An error occurred"))
    }
  }

  // Handle ESC key for edit modal
  useEffect(() => {
    if (!editingClientId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const modalElement = document.querySelector('[id="edit-client-modal"]')
      if (!modalElement) return

      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        handleCancelEdit()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [editingClientId, handleCancelEdit])

  // Handle ESC key for delete modal
  useEffect(() => {
    if (!deletingClientId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const modalElement = document.querySelector('[id="delete-client-modal"]')
      if (!modalElement) return

      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        setDeletingClientId(null)
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [deletingClientId])

  const getClientType = (type: string) => {
    return type === "individual" ? "Person / Freelancer" : "Company"
  }

  const editingClient = clients.find(
    (c) => c._id?.toString() === editingClientId
  )

  return (
    <>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <Modal
        isOpen={!!editingClientId && !!editingClient}
        onClose={handleCancelEdit}
        title="Edit Client"
        maxWidth="md"
        closeOnEscape={true}
        closeOnBackdropClick={true}
      >
        {editingClient && (
          <ClientForm
            client={editingClient}
            onSubmit={handleUpdate}
            onCancel={handleCancelEdit}
          />
        )}
      </Modal>

      <Modal
        isOpen={
          !!deletingClientId &&
          !!clients.find((c) => c._id?.toString() === deletingClientId)
        }
        onClose={() => setDeletingClientId(null)}
        title="Delete Client"
        maxWidth="sm"
        closeOnEscape={true}
        closeOnBackdropClick={true}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeletingClientId(null)}
              disabled={isDeleting}
              className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:focus:ring-offset-zinc-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-zinc-900"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this client?</p>
          {clients.find((c) => c._id?.toString() === deletingClientId) && (
            <div className="space-y-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <p>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Name:{" "}
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {
                    clients.find((c) => c._id?.toString() === deletingClientId)
                      ?.name
                  }
                </span>
              </p>
              <p>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Tax ID:{" "}
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {
                    clients.find((c) => c._id?.toString() === deletingClientId)
                      ?.taxId
                  }
                </span>
              </p>
            </div>
          )}
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This action cannot be undone.
          </p>
        </div>
      </Modal>

      <div className="space-y-4">
        {clients.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
            <p className="text-zinc-600 dark:text-zinc-400">
              No clients found. Create your first client to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Tax ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Address
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr
                    key={client._id?.toString()}
                    onClick={() => handleEdit(client._id?.toString() ?? "")}
                    className={`border-b border-zinc-200 cursor-pointer transition-colors hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-blue-900/20 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-zinc-900"
                        : "bg-zinc-50 dark:bg-zinc-800/50"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {client.taxId}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {getClientType(client.clientType)}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                      {client.address}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(client._id?.toString() ?? "")
                        }}
                        className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 dark:focus:ring-offset-zinc-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
