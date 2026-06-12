"use client"

import { useCallback, useMemo, useState } from "react"
import type { Payment } from "@/lib/domain/entities/payment"
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

/**
 * Manages sort + filter state for the monthly payments view and derives the
 * filtered/sorted payment list. Keeps the view component focused on
 * rendering and CRUD orchestration.
 */
export function useMonthlyPaymentsFilters(payments: Payment[]) {
  const [sort, setSort] = useState<PaymentSortState>({
    sortBy: "day",
    sortDir: "desc",
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

  return {
    sort,
    filters,
    filteredPayments,
    handleSortChange,
    handleTypeFilterToggle,
    handleInvoiceFilterToggle,
    handleReceiptFilterToggle,
    handleTagToggle,
    clearTagFilter,
  }
}
