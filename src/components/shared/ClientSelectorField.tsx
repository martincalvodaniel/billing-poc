"use client"
import { useState } from "react"
import ClientFormModal from "@/features/clients/components/ClientFormModal"
import { useCreateClient } from "@/features/clients/hooks/useClientMutations"
import { extractErrorMessage } from "@/features/events/components/attendeesPanel-utils"
import type { Client, ClientType } from "@/lib/domain/entities/client"
import ClientSelector from "./ClientSelector"

interface ClientSelectorFieldProps {
  /** Currently selected client ID. */
  value?: string
  /** Query shown before a client is selected. */
  initialQuery?: string
  /** Display name fallback for a selected client before it resolves. */
  selectedClientName?: string
  /** Called when the selection changes (select, clear, or inline create). */
  onChange: (
    clientId: string | undefined,
    clientName: string | undefined
  ) => void
  label?: string
  required?: boolean
  autoFocus?: boolean
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
  initialQuery,
  selectedClientName,
  onChange,
  label,
  required = false,
  autoFocus = false,
  newClientType = "individual",
  onError,
}: ClientSelectorFieldProps) {
  function handleCreateClientRequest(
    name: Parameters<
      NonNullable<React.ComponentProps<typeof ClientSelector>["onCreateClient"]>
    >[0]
  ) {
    return void handleCreateClient(name)
  }
  function editSelectedClient(
    client: Parameters<
      NonNullable<React.ComponentProps<typeof ClientSelector>["onEditClient"]>
    >[0]
  ) {
    return setEditingClient(client)
  }
  function closeEditClient() {
    return setEditingClient(null)
  }
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
        initialQuery={initialQuery}
        selectedClientName={selectedClientName}
        onChange={onChange}
        label={label}
        required={required}
        autoFocus={autoFocus}
        onCreateClient={handleCreateClientRequest}
        isCreating={isCreatingClient}
        onEditClient={editSelectedClient}
      />

      <ClientFormModal
        client={editingClient ?? undefined}
        isOpen={!!editingClient}
        onClose={closeEditClient}
      />
    </>
  )
}
