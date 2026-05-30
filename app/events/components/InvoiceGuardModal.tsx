"use client"

import { Modal } from "@/app/components/Modal"

interface InvoiceGuardModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceType: string
  invoiceId: string
}

export default function InvoiceGuardModal({
  isOpen,
  onClose,
  invoiceType,
  invoiceId,
}: InvoiceGuardModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice already generated"
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          This attendee's payment has invoice {invoiceType} {invoiceId}.
          Invoices cannot be modified once generated. To change the seat count,
          first delete the invoice from the payment, then retry.
        </p>
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            Got it
          </button>
        </div>
      </div>
    </Modal>
  )
}
