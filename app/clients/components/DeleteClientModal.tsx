"use client"

import { ConfirmFooter, Modal } from "@/app/components/Modal"
import type { Client } from "@/lib/types"

interface DeleteClientModalProps {
  client: Client | undefined
  isOpen: boolean
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteClientModal({
  client,
  isOpen,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteClientModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Delete Client"
      maxWidth="sm"
      footer={
        <ConfirmFooter
          onCancel={onCancel}
          onConfirm={onConfirm}
          isPending={isDeleting}
          confirmLabel="Delete"
          pendingLabel="Deleting..."
          variant="danger"
        />
      }
    >
      <div className="space-y-4">
        <p>Are you sure you want to delete this client?</p>
        {client && (
          <div className="space-y-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <p>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Name:{" "}
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {client.name}
              </span>
            </p>
            <p>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Tax ID:{" "}
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {client.taxId}
              </span>
            </p>
          </div>
        )}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This action cannot be undone.
        </p>
      </div>
    </Modal>
  )
}
