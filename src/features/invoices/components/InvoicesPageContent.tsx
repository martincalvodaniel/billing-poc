"use client"

import { useCallback, useMemo, useState } from "react"
import PageLayout from "@/components/shared/PageLayout"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import Toast from "@/components/ui/Toast"
import type { InvoiceReductionPreviewSnapshot } from "../hooks/useInvoiceCounterMutations"
import { useInvoiceCounters } from "../hooks/useInvoiceCounters"
import InvoicePaymentModal from "./InvoicePaymentModal"
import InvoiceSeriesPanel from "./InvoiceSeriesPanel"
import {
  formatInvoiceCounter,
  groupInvoiceCountersByYear,
  type InvoiceSeriesCounter,
} from "./invoice-counter-groups"
import ReduceInvoiceCounterModal from "./ReduceInvoiceCounterModal"

interface SelectedCounter {
  counter: InvoiceSeriesCounter
  year: number
}

export default function InvoicesPageContent() {
  const { counters, invoices, error, isLoading } = useInvoiceCounters()
  const [selectedCounter, setSelectedCounter] =
    useState<SelectedCounter | null>(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null
  )
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const yearGroups = useMemo(
    () => groupInvoiceCountersByYear(counters, invoices),
    [counters, invoices]
  )
  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? "Failed to fetch invoice numbering"
        : null
  const handleSelectCounter = useCallback(
    (year: number, counter: InvoiceSeriesCounter) => {
      setSelectedCounter({ year, counter })
    },
    []
  )
  const handleCloseModal = useCallback(() => setSelectedCounter(null), [])
  const handleOpenPayment = useCallback((paymentId: string) => {
    setSelectedCounter(null)
    setSelectedPaymentId(paymentId)
  }, [])
  const handleClosePayment = useCallback(() => setSelectedPaymentId(null), [])
  const handleClearSuccess = useCallback(() => setSuccessMessage(null), [])
  const handleReductionSuccess = useCallback(
    (preview: InvoiceReductionPreviewSnapshot) => {
      setSuccessMessage(
        `Numbering reduced to ${formatInvoiceCounter(preview.newLastNumber)}. ${preview.invoices.length} invoice${preview.invoices.length === 1 ? "" : "s"} removed from ${preview.affectedPaymentCount} payment${preview.affectedPaymentCount === 1 ? "" : "s"}.`
      )
      setSelectedCounter(null)
    },
    []
  )
  const handlePaymentUpdated = useCallback(() => {
    setSuccessMessage("Payment updated successfully.")
  }, [])
  const handlePaymentDeleted = useCallback(() => {
    setSelectedPaymentId(null)
    setSuccessMessage("Payment deleted successfully.")
  }, [])

  return (
    <PageLayout
      navigationSubtitle="Invoices"
      headerContent={
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Billing records
          </p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Invoice numbering
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Review generated invoices and safely manage each numbered series by
            year.
          </p>
        </div>
      }
    >
      {errorMessage ? <ErrorBanner bordered>{errorMessage}</ErrorBanner> : null}

      {successMessage ? (
        <Toast message={successMessage} onClose={handleClearSuccess} />
      ) : null}

      {isLoading && yearGroups.length === 0 ? (
        <EmptyState variant="card">Loading invoice numbering...</EmptyState>
      ) : yearGroups.length === 0 ? (
        <EmptyState variant="card">
          No numbered invoices have been generated yet.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {yearGroups.map((group) => (
            <section
              key={group.year}
              aria-label={`Invoice numbering for ${group.year}`}
              className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {group.year}
                </h2>
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-2">
                {group.counters.map((counter) => (
                  <InvoiceSeriesPanel
                    key={counter.series}
                    counter={counter}
                    year={group.year}
                    onReduce={handleSelectCounter}
                    onPaymentClick={handleOpenPayment}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedCounter ? (
        <ReduceInvoiceCounterModal
          key={`${selectedCounter.year}:${selectedCounter.counter.series}:${selectedCounter.counter.lastNumber}`}
          counter={selectedCounter.counter}
          year={selectedCounter.year}
          onClose={handleCloseModal}
          onPaymentClick={handleOpenPayment}
          onSuccess={handleReductionSuccess}
        />
      ) : null}

      {selectedPaymentId ? (
        <InvoicePaymentModal
          key={selectedPaymentId}
          paymentId={selectedPaymentId}
          onClose={handleClosePayment}
          onUpdate={handlePaymentUpdated}
          onDelete={handlePaymentDeleted}
        />
      ) : null}
    </PageLayout>
  )
}
