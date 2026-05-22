"use client"

import { useCallback, useState } from "react"
import { Modal } from "@/app/components/Modal"
import {
  useDeleteClient,
  useUpdateClient,
} from "@/lib/hooks/useClientMutations"
import type { Client, ClientFormData } from "@/lib/types"
import ClientForm from "./ClientForm"
import ClientTableRow from "./ClientTableRow"
import { extractClientApiError } from "./clientList-utils"
import DeleteClientModal from "./DeleteClientModal"

interface ClientListProps {
  clients: Client[]
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
      throw new Error(extractClientApiError(err, "Failed to update client"))
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
      setError(extractClientApiError(err, "An error occurred"))
    }
  }

  const editingClient = clients.find(
    (c) => c._id?.toString() === editingClientId
  )
  const deletingClient = clients.find(
    (c) => c._id?.toString() === deletingClientId
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
      >
        {editingClient && (
          <ClientForm
            client={editingClient}
            onSubmit={handleUpdate}
            onCancel={handleCancelEdit}
          />
        )}
      </Modal>

      <DeleteClientModal
        client={deletingClient}
        isOpen={!!deletingClientId && !!deletingClient}
        isDeleting={isDeleting}
        onCancel={() => setDeletingClientId(null)}
        onConfirm={handleConfirmDelete}
      />

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
                  <ClientTableRow
                    key={client._id?.toString()}
                    client={client}
                    index={index}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
