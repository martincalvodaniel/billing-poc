"use client"

import type { ReactNode } from "react"
import { ConfirmFooter, Modal } from "@/app/components/Modal"

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

/**
 * Reusable destructive-confirm dialog used across absence modals.
 * Mirrors the inline confirm modals from iter1-12 byte-for-byte:
 * - Disables backdrop close while pending (`if (!isPending)` guard).
 * - Cancel button left, Delete (red) button right, both flex-1.
 * - Optional inline error banner above the body content.
 */
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
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isPending) onCancel()
      }}
      title={title}
      maxWidth="sm"
      footer={
        <ConfirmFooter
          onCancel={onCancel}
          onConfirm={onConfirm}
          isPending={isPending}
          confirmLabel={confirmLabel}
          pendingLabel={pendingLabel}
          variant="danger"
        />
      }
    >
      <div className="space-y-3">
        {errorMessage && (
          <div
            className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            {errorMessage}
          </div>
        )}
        {children}
      </div>
    </Modal>
  )
}
