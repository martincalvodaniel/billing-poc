"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Modal } from "@/components/ui/Modal"
import type { PaymentFormData } from "@/lib/domain/entities/payment"
import PaymentForm from "./month/PaymentForm"

interface PaymentFormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  initialDate?: string
  initialData?: PaymentFormData
  onPaymentSaved?: (date: string) => void
  saveLabel?: string
  pendingLabel?: string
}

export default function PaymentFormModal({
  isOpen,
  onClose,
  title,
  initialDate,
  initialData,
  onPaymentSaved,
  saveLabel = "Save Payment",
  pendingLabel = "Saving...",
}: PaymentFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<{
    setFormDate: (dateString: string) => void
    submit: () => void
  }>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePaymentSaved = useCallback(
    (date: string) => {
      onPaymentSaved?.(date)
      onClose()
    },
    [onClose, onPaymentSaved]
  )

  const handleClose = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    onClose()
    setIsSubmitting(false)
  }, [onClose])

  const handleSave = useCallback(() => {
    setIsSubmitting(true)
    formRef.current?.submit()
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsSubmitting(false)
      timeoutRef.current = null
    }, 100)
  }, [])

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    },
    []
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth="xl"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:focus:ring-offset-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800 dark:focus:ring-offset-zinc-900"
          >
            {String(isSubmitting ? pendingLabel : saveLabel)}
          </button>
        </div>
      }
    >
      <PaymentForm
        ref={formRef}
        onPaymentSaved={handlePaymentSaved}
        initialDate={initialDate}
        initialData={initialData}
      />
    </Modal>
  )
}
