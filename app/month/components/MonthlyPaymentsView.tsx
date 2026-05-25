"use client"

import dynamic from "next/dynamic"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDeletePayment } from "@/lib/hooks/usePaymentMutations"
import { usePayments } from "@/lib/hooks/usePayments"
import type { Payment } from "@/lib/types"
import Toast from "../../components/Toast"
import PaymentsSummary from "./PaymentsSummary"
import PaymentsTable from "./PaymentsTable"

const PaymentCharts = dynamic(() => import("./PaymentCharts"), { ssr: false })
const DeletePaymentModal = dynamic(() => import("./DeletePaymentModal"), {
  ssr: false,
})
const PaymentDetailModal = dynamic(() => import("./PaymentDetailModal"), {
  ssr: false,
})

export default function MonthlyPaymentsView({
  selectedDate,
  showCharts = true,
}: {
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

  // Auto-open the payment-detail modal when arriving with ?payment=<id>.
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const consumedPaymentRef = useRef<string | null>(null)
  useEffect(() => {
    const target = searchParams.get("payment")
    if (!target) return
    if (consumedPaymentRef.current === target) return
    if (isLoading) return
    if (payments.some((p) => p._id?.toString() === target)) {
      setEditPaymentId(target)
    }
    consumedPaymentRef.current = target
    router.replace(`${pathname}?year=${year}&month=${month}`, {
      scroll: false,
    })
  }, [payments, isLoading, searchParams, year, month, pathname, router])

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

  // Enter-to-confirm for the delete modal. ESC is handled by Modal itself.
  useEffect(() => {
    if (!deleteConfirmPaymentId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        handleConfirmDelete()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [deleteConfirmPaymentId, handleConfirmDelete])

  // Combine iterations: compute totals, counts, and tag breakdowns in a single pass (js-combine-iterations)
  const {
    totalIncome,
    totalOutcome,
    incomeCount,
    outcomeCount,
    incomeByTag,
    outcomeByTag,
  } = useMemo(() => {
    let income = 0
    let outcome = 0
    let incCount = 0
    let outCount = 0
    const incByTag: Record<string, number> = {}
    const outByTag: Record<string, number> = {}
    for (const p of payments) {
      const tag = p.tag || "Untagged"
      if (p.type === "income") {
        income += p.total
        incByTag[tag] = (incByTag[tag] || 0) + p.total
        incCount++
      } else {
        outcome += p.total
        outByTag[tag] = (outByTag[tag] || 0) + p.total
        outCount++
      }
    }
    return {
      totalIncome: income,
      totalOutcome: outcome,
      incomeCount: incCount,
      outcomeCount: outCount,
      incomeByTag: incByTag,
      outcomeByTag: outByTag,
    }
  }, [payments])

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
        filteredPayments={payments}
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
