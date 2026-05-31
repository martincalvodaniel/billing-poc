"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import { usePayments } from "@/lib/hooks/usePayments"
import Toast from "../../components/Toast"
import MonthlyPaymentsModals from "./MonthlyPaymentsModals"
import { computePaymentTotals } from "./monthlyPaymentsView-totals"
import PaymentsSummary from "./PaymentsSummary"
import PaymentsTable from "./PaymentsTable"
import { useMonthlyPaymentsActions } from "./useMonthlyPaymentsActions"
import { useMonthlyPaymentsFilters } from "./useMonthlyPaymentsFilters"

const PaymentCharts = dynamic(() => import("./PaymentCharts"), { ssr: false })

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

  const {
    sort,
    filters,
    filteredPayments,
    handleSortChange,
    handleTypeFilterToggle,
    handleInvoiceFilterToggle,
    handleReceiptFilterToggle,
    handleTagToggle,
    clearTagFilter,
  } = useMonthlyPaymentsFilters(payments)

  const {
    actionError,
    showSuccess,
    successMessage,
    dismissSuccess,
    isDeleting,
    deleteConfirmPaymentId,
    editPaymentId,
    duplicateSeed,
    handleRowClick,
    closeEditModal,
    closeDeleteModal,
    closeDuplicateModal,
    handleDeleteClick,
    handleDuplicateClick,
    handlePaymentDuplicated,
    handlePaymentUpdated,
    handleEditDeleted,
    handleConfirmDelete,
  } = useMonthlyPaymentsActions({ payments, isLoading, year, month })

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
  } = useMemo(() => computePaymentTotals(payments), [payments])

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
        <Toast message={successMessage} onClose={dismissSuccess} />
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

      <MonthlyPaymentsModals
        payments={payments}
        deleteConfirmPaymentId={deleteConfirmPaymentId}
        isDeleting={isDeleting}
        onCloseDelete={closeDeleteModal}
        onConfirmDelete={handleConfirmDelete}
        editPaymentId={editPaymentId}
        onCloseEdit={closeEditModal}
        onUpdate={handlePaymentUpdated}
        onDeleteEdit={handleEditDeleted}
        duplicateSeed={duplicateSeed}
        onCloseDuplicate={closeDuplicateModal}
        onCreateDuplicate={handlePaymentDuplicated}
      />
    </div>
  )
}
