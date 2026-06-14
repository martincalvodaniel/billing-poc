"use client"
import type { ReactNode } from "react"
import { useStableCallback } from "@/hooks/useStableCallback"
import { ErrorBanner } from "./ErrorBanner"
import { ConfirmFooter, Modal } from "./Modal"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  confirmLabel?: string
  pendingLabel?: string
  cancelLabel?: string
  variant?: "danger" | "primary"
  isPending: boolean
  error?: string | null
  onCancel: () => void
  onConfirm: () => void
  children: ReactNode
}
export function ConfirmDialog({
  isOpen,
  title,
  confirmLabel = "Confirm",
  pendingLabel = "Working…",
  cancelLabel = "Cancel",
  variant = "danger",
  isPending,
  error,
  onCancel,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const handleClose = useStableCallback(() => {
    if (!isPending) onCancel()
  })
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth="sm"
      footer={
        <ConfirmFooter
          onCancel={onCancel}
          onConfirm={onConfirm}
          isPending={isPending}
          confirmLabel={confirmLabel}
          pendingLabel={pendingLabel}
          cancelLabel={cancelLabel}
          variant={variant}
        />
      }
    >
      <div className="space-y-3">
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}
        {children}
      </div>
    </Modal>
  )
}
