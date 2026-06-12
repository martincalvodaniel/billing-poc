"use client"

import { Modal } from "@/app/components/Modal"
import type { Client, ClientFormData } from "@/lib/domain/entities/client"
import { useUpdateClient } from "@/lib/hooks/useClientMutations"
import ClientForm from "./ClientForm"
import { extractClientApiError } from "./clientList-utils"

interface ClientFormModalProps {
  client: Client | undefined
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ClientFormModal({
  client,
  isOpen,
  onClose,
  onSuccess,
}: ClientFormModalProps) {
  const { trigger: updateClient } = useUpdateClient()

  const handleSubmit = async (data: ClientFormData) => {
    if (!client?._id) return
    try {
      await updateClient({ id: client._id, ...data })
    } catch (err) {
      throw new Error(extractClientApiError(err, "Failed to update client"))
    }
    onClose()
    onSuccess?.()
  }

  return (
    <Modal
      isOpen={isOpen && !!client}
      onClose={onClose}
      title="Edit Client"
      maxWidth="xl"
    >
      {client ? (
        <ClientForm
          client={client}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Modal>
  )
}
