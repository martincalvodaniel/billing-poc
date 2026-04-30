"use client"

import { useCallback, useEffect, useState } from "react"
import { useDeletePayment } from "@/lib/hooks/usePaymentMutations"
import { usePayments } from "@/lib/hooks/usePayments"
import type { Payment } from "@/lib/types"
import Toast from "../../components/Toast"
import DeletePaymentModal from "./DeletePaymentModal"
import PaymentCharts from "./PaymentCharts"
import PaymentDetailModal from "./PaymentDetailModal"
import PaymentsSummary from "./PaymentsSummary"
import PaymentsTable from "./PaymentsTable"

export default function MonthlyPaymentsView({
  onMonthChange,
  selectedDate,
  showCharts = true,
}: {
  onMonthChange?: (dateString: string) => void
  selectedDate: Date
  showCharts?: boolean
}) {
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth() + 1

  const {
    payments,
    isLoading,
    error: fetchError,
  } = usePayments({ year, month })

  const { trigger: deletePayment, isMutating: isDeleting } = useDeletePayment()

  const [actionError, setActionError] = useState<string | null>(null)

  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>("")

  // Delete confirmation state
  const [deleteConfirmPaymentId, setDeleteConfirmPaymentId] = useState<
    string | null
  >(null)

  // Edit modal state (full payment edit)
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null)

  // Notify parent when month changes so form date can be synced
  useEffect(() => {
    const yearStr = selectedDate.getFullYear()
    const monthStr = String(selectedDate.getMonth() + 1).padStart(2, "0")
    const day = String(selectedDate.getDate()).padStart(2, "0")
    const dateString = `${yearStr}-${monthStr}-${day}`
    onMonthChange?.(dateString)
  }, [selectedDate, onMonthChange])

  const getFilteredPayments = () => {
    // No client-side filtering needed since API returns only relevant month's payments
    return payments
  }

  const handleRowClick = (paymentId: string) => {
    setEditPaymentId(paymentId)
  }

  const closeEditModal = () => {
    setEditPaymentId(null)
  }

  const handleDeleteClick = (e: React.MouseEvent, paymentId: string) => {
    e.stopPropagation() // Prevent row click
    setDeleteConfirmPaymentId(paymentId)
  }

  const handlePaymentUpdated = (_updatedPayment: Payment) => {
    // useUpdatePayment invalidates the payments cache automatically.
    setSuccessMessage("Payment updated successfully")
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 4000)
  }

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmPaymentId) return

    try {
      await deletePayment({ id: deleteConfirmPaymentId })

      setDeleteConfirmPaymentId(null)
      setSuccessMessage("Payment deleted successfully")
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
    } catch (err) {
      console.error(`Error deleting payment: ${err}`)
      setActionError(err instanceof Error ? err.message : "An error occurred")
      setDeleteConfirmPaymentId(null)
    }
  }, [deleteConfirmPaymentId, deletePayment])

  const handleDeleteModalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (deleteConfirmPaymentId) {
        if (e.key === "Escape") {
          e.preventDefault()
          e.stopPropagation()
          setDeleteConfirmPaymentId(null)
        } else if (e.key === "Enter") {
          e.preventDefault()
          e.stopPropagation()
          handleConfirmDelete()
        }
      }
    },
    [deleteConfirmPaymentId, handleConfirmDelete]
  )

  // Register keyboard handler for delete modal
  useEffect(() => {
    if (!deleteConfirmPaymentId) return

    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleDeleteModalKeyDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("keydown", handleDeleteModalKeyDown)
    }
  }, [deleteConfirmPaymentId, handleDeleteModalKeyDown])

  const filteredPayments = getFilteredPayments()

  // Combine iterations: compute totals, counts, and tag breakdowns in a single pass (js-combine-iterations)
  let totalIncome = 0
  let totalOutcome = 0
  let incomeCount = 0
  let outcomeCount = 0
  const incomeByTag: Record<string, number> = {}
  const outcomeByTag: Record<string, number> = {}
  for (const p of filteredPayments) {
    const tag = p.tag || "Untagged"
    if (p.type === "income") {
      totalIncome += p.total
      incomeByTag[tag] = (incomeByTag[tag] || 0) + p.total
      incomeCount++
    } else {
      totalOutcome += p.total
      outcomeByTag[tag] = (outcomeByTag[tag] || 0) + p.total
      outcomeCount++
    }
  }

  const netBalance = totalIncome - totalOutcome

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-800"></div>
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-800"></div>
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-800"></div>
        </div>
      </div>
    )
  }

  const displayError =
    actionError ??
    (fetchError instanceof Error
      ? fetchError.message
      : fetchError
        ? "Failed to fetch payments"
        : null)

  return (
    <div className="w-full space-y-2">
      {showSuccess && (
        <Toast message={successMessage} onClose={() => setShowSuccess(false)} />
      )}

      {showCharts && (
        <PaymentsSummary
          totalIncome={totalIncome}
          totalOutcome={totalOutcome}
          netBalance={netBalance}
          incomeCount={incomeCount}
          outcomeCount={outcomeCount}
        />
      )}

      {showCharts && (
        <PaymentCharts incomeByTag={incomeByTag} outcomeByTag={outcomeByTag} />
      )}

      <PaymentsTable
        payments={payments}
        filteredPayments={filteredPayments}
        selectedDate={selectedDate}
        error={displayError}
        onRowClick={handleRowClick}
        onDeleteClick={handleDeleteClick}
      />

      {deleteConfirmPaymentId && (
        <DeletePaymentModal
          payment={payments.find(
            (p) => p._id?.toString() === deleteConfirmPaymentId
          )}
          isDeleting={isDeleting}
          onClose={() => setDeleteConfirmPaymentId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {editPaymentId &&
        (() => {
          const selectedPayment = payments.find(
            (p) => p._id?.toString() === editPaymentId
          )
          if (!selectedPayment) return null
          return (
            <PaymentDetailModal
              payment={selectedPayment}
              onClose={closeEditModal}
              onUpdate={handlePaymentUpdated}
            />
          )
        })()}
    </div>
  )
}
