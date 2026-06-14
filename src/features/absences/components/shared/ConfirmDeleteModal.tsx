"use client"

import type { ReactNode } from "react"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

interface ConfirmDeleteModalProps {
  isOpen: boolean
  title: string
  confirmLabel?: string
  pendingLabel?: string
  isPending: boolean
  errorMessage?: string | null
  onCancel: () => void
  onConfirm: () => void
  children: ReactNode
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  confirmLabel = "Delete",
  pendingLabel = "Deleting…",
  isPending,
  errorMessage,
  onCancel,
  onConfirm,
  children,
}: ConfirmDeleteModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      confirmLabel={confirmLabel}
      pendingLabel={pendingLabel}
      variant="danger"
      isPending={isPending}
      error={errorMessage}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {children}
    </ConfirmDialog>
  )
}
