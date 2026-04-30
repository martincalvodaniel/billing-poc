"use client"

import type { Ref } from "react"
import { useCallback, useEffect, useImperativeHandle, useState } from "react"
import type { Payment } from "@/lib/types"
import Toast from "../../components/Toast"
import DeletePaymentModal from "./DeletePaymentModal"
import PaymentCharts from "./PaymentCharts"
import PaymentDetailModal from "./PaymentDetailModal"
import PaymentsSummary from "./PaymentsSummary"
import PaymentsTable from "./PaymentsTable"

export default (function MonthlyPaymentsView({
  ref,
  ...props
}: {
  ref?: Ref<{
    refreshPayments: () => void
    navigateToMonth: (dateString: string) => void
    getFilteredPaymentsCount: () => number
  } | null>
  onMonthChange?: (dateString: string) => void
  selectedDate: Date
}) {
  const { onMonthChange, selectedDate } = props
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>("")

  // Delete confirmation state
  const [deleteConfirmPaymentId, setDeleteConfirmPaymentId] = useState<
    string | null
  >(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit modal state (full payment edit)
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null)

  const fetchPayments = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setIsLoading(true)
        setError(null)

        const year = selectedDate.getFullYear()
        const month = selectedDate.getMonth() + 1

        const response = await fetch(
          `/api/payments?year=${year}&month=${month}`,
          {
            signal,
          }
        )

        if (!response.ok) {
          throw new Error("Failed to fetch payments")
        }

        const data = await response.json()
        if (!signal?.aborted) {
          setPayments(data.payments || [])
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, ignore
          return
        }
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred"
        if (!signal?.aborted) {
          setError(errorMessage)
        }
        console.error(`Error fetching payments: ${err}`)
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [selectedDate]
  )

  useEffect(() => {
    const abortController = new AbortController()
    fetchPayments(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [fetchPayments])

  // Notify parent when month changes so form date can be synced
  useEffect(() => {
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
    const day = String(selectedDate.getDate()).padStart(2, "0")
    const dateString = `${year}-${month}-${day}`
    onMonthChange?.(dateString)
  }, [selectedDate, onMonthChange])

  useImperativeHandle(ref, () => ({
    refreshPayments: () => fetchPayments(),
    navigateToMonth: () => {
      // Month navigation is now handled by parent component via selectedDate prop
    },
    getFilteredPaymentsCount: () => payments.length,
  }))

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

  const handlePaymentUpdated = (updatedPayment: Payment) => {
    setPayments((prevPayments) =>
      prevPayments.map((p) =>
        p._id?.toString() === updatedPayment._id?.toString()
          ? updatedPayment
          : p
      )
    )
    setSuccessMessage("Payment updated successfully")
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 4000)
  }

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmPaymentId) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteConfirmPaymentId }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete payment")
      }

      // Remove payment from local state
      setPayments((prevPayments) =>
        prevPayments.filter((p) => p._id?.toString() !== deleteConfirmPaymentId)
      )

      setDeleteConfirmPaymentId(null)
      setSuccessMessage("Payment deleted successfully")
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
    } catch (err) {
      console.error(`Error deleting payment: ${err}`)
      setError(err instanceof Error ? err.message : "An error occurred")
      setDeleteConfirmPaymentId(null)
    } finally {
      setIsDeleting(false)
    }
  }, [deleteConfirmPaymentId])

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

  // Year-level aggregations
  // Generate colors for chart segments

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

  return (
    <div className="w-full space-y-6">
      {showSuccess && (
        <Toast message={successMessage} onClose={() => setShowSuccess(false)} />
      )}

      <PaymentsSummary
        totalIncome={totalIncome}
        totalOutcome={totalOutcome}
        netBalance={netBalance}
        incomeCount={incomeCount}
        outcomeCount={outcomeCount}
      />

      <PaymentCharts incomeByTag={incomeByTag} outcomeByTag={outcomeByTag} />

      <PaymentsTable
        payments={payments}
        filteredPayments={filteredPayments}
        selectedDate={selectedDate}
        error={error}
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
})
