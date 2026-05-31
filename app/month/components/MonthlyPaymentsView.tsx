"use client"

import dynamic from "next/dynamic"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Payment } from "@/lib/domain/entities/payment"
import { useDeletePayment } from "@/lib/hooks/usePaymentMutations"
import { usePayments } from "@/lib/hooks/usePayments"
import Toast from "../../components/Toast"
import {
  filterPayments,
  nextSortState,
  type PaymentFilters,
  type PaymentSortKey,
  type PaymentSortState,
  type PaymentTypeFilter,
  sortPayments,
  toggleInvoiceFilter,
  toggleTagFilter,
  toggleTypeFilter,
} from "./monthlyPaymentsView-filters"
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

  // Duplicate modal state — holds the source payment to seed the create form.
  const [duplicateSeed, setDuplicateSeed] = useState<Payment | null>(null)

  const [sort, setSort] = useState<PaymentSortState>({
    sortBy: "day",
    sortDir: "asc",
  })
  const [filters, setFilters] = useState<PaymentFilters>({
    type: "all",
    hasInvoice: "all",
    hasReceipt: "all",
    tags: [],
  })

  const filteredPayments = useMemo(
    () =>
      sortPayments(
        filterPayments(payments, filters),
        sort.sortBy,
        sort.sortDir
      ),
    [payments, filters, sort.sortBy, sort.sortDir]
  )

  const handleSortChange = useCallback((key: PaymentSortKey) => {
    setSort((prev) => nextSortState(prev, key))
  }, [])

  const handleTypeFilterToggle = useCallback(
    (type: Exclude<PaymentTypeFilter, "all">) => {
      setFilters((prev) => ({
        ...prev,
        type: toggleTypeFilter(prev.type, type),
      }))
    },
    []
  )

  const handleInvoiceFilterToggle = useCallback((hasInvoice: boolean) => {
    setFilters((prev) => ({
      ...prev,
      hasInvoice: toggleInvoiceFilter(prev.hasInvoice, hasInvoice),
    }))
  }, [])

  const handleReceiptFilterToggle = useCallback((hasReceipt: boolean) => {
    setFilters((prev) => ({
      ...prev,
      hasReceipt: toggleInvoiceFilter(prev.hasReceipt, hasReceipt),
    }))
  }, [])

  const handleTagToggle = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: toggleTagFilter(prev.tags, tag),
    }))
  }, [])

  const clearTagFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, tags: [] }))
  }, [])

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
    if (payments.some((p) => p._id === target)) {
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

  const handleDuplicateClick = (e: React.MouseEvent, paymentId: string) => {
    e.stopPropagation()
    const source = payments.find((p) => p._id === paymentId)
    if (source) setDuplicateSeed(source)
  }

  const handlePaymentDuplicated = () => {
    setDuplicateSeed(null)
    setSuccessMessage("Payment duplicated successfully")
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 4000)
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
    totalVat,
    totalVatIncome,
    totalVatOutcome,
    totalNet,
    totalNetIncome,
    totalNetOutcome,
    incomeCount,
    outcomeCount,
    incomeByTag,
    outcomeByTag,
  } = useMemo(() => {
    let income = 0
    let outcome = 0
    let vatIncome = 0
    let vatOutcome = 0
    let netIncome = 0
    let netOutcome = 0
    let incCount = 0
    let outCount = 0
    const incByTag: Record<string, number> = {}
    const outByTag: Record<string, number> = {}
    for (const p of payments) {
      const tag = p.tag || "Untagged"
      if (p.type === "income") {
        income += p.total
        vatIncome += p.vatAmount
        netIncome += p.netAmount
        incByTag[tag] = (incByTag[tag] || 0) + p.total
        incCount++
      } else {
        outcome += p.total
        vatOutcome += p.vatAmount
        netOutcome += p.netAmount
        outByTag[tag] = (outByTag[tag] || 0) + p.total
        outCount++
      }
    }
    return {
      totalIncome: income,
      totalOutcome: outcome,
      totalVat: vatIncome - vatOutcome,
      totalVatIncome: vatIncome,
      totalVatOutcome: vatOutcome,
      totalNet: netIncome - netOutcome,
      totalNetIncome: netIncome,
      totalNetOutcome: netOutcome,
      incomeCount: incCount,
      outcomeCount: outCount,
      incomeByTag: incByTag,
      outcomeByTag: outByTag,
    }
  }, [payments])

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
          totalVat={totalVat}
          totalVatIncome={totalVatIncome}
          totalVatOutcome={totalVatOutcome}
          totalNet={totalNet}
          totalNetIncome={totalNetIncome}
          totalNetOutcome={totalNetOutcome}
          incomeCount={incomeCount}
          outcomeCount={outcomeCount}
          typeFilter={filters.type}
          onTypeFilterToggle={handleTypeFilterToggle}
        />
      )}

      {showCharts && (
        <PaymentCharts
          incomeByTag={incomeByTag}
          outcomeByTag={outcomeByTag}
          selectedTags={filters.tags}
          onToggleTag={handleTagToggle}
        />
      )}

      {filters.tags.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearTagFilter}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Clear tag filter
          </button>
        </div>
      )}

      <PaymentsTable
        payments={payments}
        filteredPayments={filteredPayments}
        selectedDate={selectedDate}
        error={displayError}
        onRowClick={handleRowClick}
        onDeleteClick={handleDeleteClick}
        onDuplicateClick={handleDuplicateClick}
        sort={sort}
        onSortChange={handleSortChange}
        typeFilter={filters.type}
        hasInvoiceFilter={filters.hasInvoice}
        hasReceiptFilter={filters.hasReceipt}
        selectedTags={filters.tags}
        onTypeFilterToggle={handleTypeFilterToggle}
        onInvoiceFilterToggle={handleInvoiceFilterToggle}
        onReceiptFilterToggle={handleReceiptFilterToggle}
        onTagFilterToggle={handleTagToggle}
      />

      {deleteConfirmPaymentId && (
        <DeletePaymentModal
          payment={payments.find((p) => p._id === deleteConfirmPaymentId)}
          isDeleting={isDeleting}
          onClose={() => setDeleteConfirmPaymentId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {editPaymentId &&
        (() => {
          const selectedPayment = payments.find((p) => p._id === editPaymentId)
          if (!selectedPayment) return null
          return (
            <PaymentDetailModal
              payment={selectedPayment}
              onClose={closeEditModal}
              onUpdate={handlePaymentUpdated}
              onDelete={() => {
                setEditPaymentId(null)
                setSuccessMessage("Payment deleted successfully")
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 4000)
              }}
            />
          )
        })()}

      {duplicateSeed && (
        <PaymentDetailModal
          payment={duplicateSeed}
          mode="duplicate"
          onClose={() => setDuplicateSeed(null)}
          onCreate={handlePaymentDuplicated}
        />
      )}
    </div>
  )
}
