"use client"

import type { ReactNode } from "react"
import Modal from "@/app/components/Modal"

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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
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
