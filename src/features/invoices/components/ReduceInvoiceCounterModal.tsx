"use client"

import { useId, useState } from "react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmFooter, Modal } from "@/components/ui/Modal"
import NumberStepperInput from "@/components/ui/NumberStepperInput"
import { FetchError } from "@/lib/client/swr-fetcher"
import {
  type InvoiceReductionPreviewSnapshot,
  usePreviewInvoiceCounter,
  useReduceInvoiceCounter,
} from "../hooks/useInvoiceCounterMutations"
import InvoiceRecordList from "./InvoiceRecordList"
import {
  formatInvoiceCounter,
  type InvoiceSeriesCounter,
} from "./invoice-counter-groups"

interface ReduceInvoiceCounterModalProps {
  counter: InvoiceSeriesCounter
  year: number
  onClose: () => void
  onPaymentClick: (paymentId: string) => void
  onSuccess: (preview: InvoiceReductionPreviewSnapshot) => void
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export default function ReduceInvoiceCounterModal({
  counter,
  year,
  onClose,
  onPaymentClick,
  onSuccess,
}: ReduceInvoiceCounterModalProps) {
  const inputId = useId()
  const [newLastNumber, setNewLastNumber] = useState(() =>
    String(Math.max(0, counter.lastNumber - 1))
  )
  const [error, setError] = useState<string | null>(null)
  const {
    trigger: previewReduction,
    data: previewResponse,
    isMutating: isPreviewing,
    reset: resetPreview,
  } = usePreviewInvoiceCounter()
  const { trigger: reduceCounter, isMutating: isReducing } =
    useReduceInvoiceCounter()
  const preview = previewResponse?.preview
  const isPending = isPreviewing || isReducing

  const handleClose = () => {
    if (!isPending) onClose()
  }

  const handleReview = async () => {
    setError(null)
    const parsedNumber = Number(newLastNumber)
    if (!Number.isInteger(parsedNumber) || parsedNumber < 0) {
      setError("Enter a whole number greater than or equal to zero.")
      return
    }
    if (parsedNumber >= counter.lastNumber) {
      setError(`Enter a number lower than ${counter.lastNumber}.`)
      return
    }

    try {
      await previewReduction({
        series: counter.series,
        year,
        newLastNumber: parsedNumber,
      })
    } catch (caught) {
      setError(
        getErrorMessage(caught, "Failed to preview invoice counter reduction")
      )
    }
  }

  const handleBack = () => {
    resetPreview()
    setError(null)
  }

  const handleConfirm = async () => {
    if (!preview) return
    setError(null)
    try {
      const result = await reduceCounter({
        series: preview.series,
        year: preview.year,
        newLastNumber: preview.newLastNumber,
        expectedCurrentNumber: preview.currentNumber,
      })
      onSuccess(result.preview)
    } catch (caught) {
      if (caught instanceof FetchError && caught.status === 409) {
        resetPreview()
      }
      setError(getErrorMessage(caught, "Failed to reduce invoice counter"))
    }
  }

  return (
    <Modal
      isOpen
      onClose={handleClose}
      title={`Reduce ${counter.label} — ${year}`}
      maxWidth="xl"
      stickyFooter
      footer={
        preview ? (
          <ConfirmFooter
            onCancel={handleBack}
            onConfirm={handleConfirm}
            isPending={isPending}
            cancelLabel="Back"
            confirmLabel="Delete invoices and reduce"
            pendingLabel="Reducing…"
            variant="danger"
          />
        ) : (
          <ConfirmFooter
            onCancel={handleClose}
            onConfirm={handleReview}
            isPending={isPending}
            confirmLabel="Review impact"
            pendingLabel="Reviewing…"
            variant="primary"
          />
        )
      }
    >
      <div className="space-y-4">
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        {preview ? (
          <>
            <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              This action permanently removes the invoice references listed
              below. The affected payments remain in place.
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-zinc-100 p-3 dark:bg-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  New number
                </p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatInvoiceCounter(preview.newLastNumber)}
                </p>
              </div>
              <div className="rounded-md bg-zinc-100 p-3 dark:bg-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Invoices deleted
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {preview.invoices.length}
                </p>
              </div>
              <div className="rounded-md bg-zinc-100 p-3 dark:bg-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Payments affected
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {preview.affectedPaymentCount}
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
              <InvoiceRecordList
                invoices={preview.invoices}
                emptyMessage="No invoice references or payments will be affected; only the counter will change."
                onPaymentClick={onPaymentClick}
              />
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              The current number is {formatInvoiceCounter(counter.lastNumber)}.
              Choose a lower value to review exactly which invoices and payments
              will be affected before confirming.
            </p>
            <div>
              <label
                htmlFor={inputId}
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
              >
                New last number
              </label>
              <NumberStepperInput
                id={inputId}
                value={newLastNumber}
                onValueChange={setNewLastNumber}
                ariaLabel="new last invoice number"
                min={0}
                max={counter.lastNumber - 1}
                step={1}
                disabled={isPending}
                required
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
