"use client"

import { useState } from "react"
import ClientFormModal from "@/app/clients/components/ClientFormModal"
import ClientSelector from "@/app/components/ClientSelector"
import { extractErrorMessage } from "@/app/events/components/attendeesPanel-utils"
import type { Client, ClientType } from "@/lib/domain/entities/client"
import { useCreateClient } from "@/lib/hooks/useClientMutations"

interface ClientSelectorFieldProps {
  /** Currently selected client ID. */
  value?: string
  /** Called when the selection changes (select, clear, or inline create). */
  onChange: (
    clientId: string | undefined,
    clientName: string | undefined
  ) => void
  label?: string
  required?: boolean
  /** Client type used when creating a client inline. Defaults to "individual". */
  newClientType?: ClientType
  /** Surface creation errors to the caller (e.g. a toast or error banner). */
  onError?: (message: string) => void
}

/**
 * Reusable client field combining a searchable selector with inline client
 * creation and an edit affordance for the selected client. Shared across the
 * app (payments, events) and intended for reuse by future invoice modals.
 */
export default function ClientSelectorField({
  value,
  onChange,
  label,
  required = false,
  newClientType = "individual",
  onError,
}: ClientSelectorFieldProps) {
  const { trigger: createClient } = useCreateClient()
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const handleCreateClient = async (name: string) => {
    setIsCreatingClient(true)
    try {
      const { id } = await createClient({ name, clientType: newClientType })
      onChange(id, name)
    } catch (error) {
      onError?.(extractErrorMessage(error, "Failed to create client"))
    } finally {
      setIsCreatingClient(false)
    }
  }

  return (
    <>
      <ClientSelector
        value={value}
        onChange={onChange}
        label={label}
        required={required}
        onCreateClient={(name) => void handleCreateClient(name)}
        isCreating={isCreatingClient}
        onEditClient={(client) => setEditingClient(client)}
      />

      <ClientFormModal
        client={editingClient ?? undefined}
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
      />
    </>
  )
}
