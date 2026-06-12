"use client"
import { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { useFocusTrap } from "@/lib/hooks/useFocusTrap"
import { useStableCallback } from "@/lib/hooks/useStableCallback"
import CloseButton from "./CloseButton"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  headerActions?: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl"
}
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  headerActions,
  maxWidth = "md",
}: ModalProps) {
  const handleBackdropClick = useStableCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    }
  )
  const id = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  useFocusTrap(dialogRef, isOpen)
  // Browser Back button (desktop and mobile) closes the modal.
  // On open: push a sentinel history entry (same URL, state={modal:true}).
  // On Back: popstate fires → close the modal; the pointer is already at the
  //   previous entry, so no further action is needed.
  // On close by X / backdrop / Cancel: replaceState replaces the sentinel
  //   in-place — synchronous, fires NO popstate, causes NO navigation.
  //   Safe in React Strict Mode: replaceState is sync so the re-mount's
  //   pushState always sees state.modal===false and adds a fresh sentinel.
  useEffect(() => {
    if (!isOpen) return
    history.pushState({ modal: true }, "")
    const handlePopState = () => {
      onCloseRef.current()
    }
    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
      if (history.state?.modal) {
        history.replaceState(null, "")
      }
    }
  }, [isOpen])
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      const modalElement = document.querySelector('[role="dialog"]')
      if (!modalElement) return
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown)
    }, 0)
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])
  if (!isOpen || typeof document === "undefined") return null
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  }[maxWidth]
  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close is a standard modal pattern
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={`${maxWidthClass} w-full max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-lg dark:bg-zinc-900`}
        role="dialog"
        aria-labelledby={`${id}-modal-title`}
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2
            id={`${id}-modal-title`}
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {title}
          </h2>
          <div className="ml-4 flex items-center gap-2">
            {headerActions}
            <CloseButton onClick={onClose} label="Close dialog" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer (optional) */}
        {footer ? (
          <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  )
}
interface ConfirmFooterProps {
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
  confirmLabel?: string
  pendingLabel?: string
  cancelLabel?: string
  variant?: "danger" | "primary"
}
export function ConfirmFooter({
  onConfirm,
  onCancel,
  isPending = false,
  confirmLabel = "Confirm",
  pendingLabel = "Working…",
  cancelLabel = "Cancel",
  variant = "primary",
}: ConfirmFooterProps) {
  const confirmClass =
    variant === "danger"
      ? "flex-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-offset-zinc-900"
      : "flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-zinc-900"
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={isPending}
        className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isPending}
        aria-busy={isPending}
        className={confirmClass}
      >
        {String(isPending ? pendingLabel : confirmLabel)}
      </button>
    </div>
  )
}
