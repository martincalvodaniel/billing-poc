"use client"

import { useEffect, useId } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: "sm" | "md" | "lg"
  closeOnEscape?: boolean
  closeOnEnter?: boolean
  closeOnBackdropClick?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "md",
  closeOnEscape = true,
  closeOnEnter = false,
  closeOnBackdropClick = true,
}: ModalProps) {
  const id = useId()
  // Handle ESC key and optional ENTER key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const modalElement = document.querySelector('[role="dialog"]')
      if (!modalElement) return

      if (e.key === "Escape" && closeOnEscape) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      } else if (e.key === "Enter" && closeOnEnter) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose, closeOnEscape, closeOnEnter])

  if (!isOpen) return null

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  }[maxWidth]

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close is a standard modal pattern
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
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
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="ml-4 rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
