import type { Payment } from "@/lib/types"

export type PaymentSortKey =
  | "day"
  | "type"
  | "tag"
  | "total"
  | "vat"
  | "surcharge"
  | "net"
  | "invoices"

export type PaymentSortDir = "asc" | "desc"

export type PaymentTypeFilter = "all" | "income" | "outcome"

export type PaymentInvoiceFilter = "all" | "yes" | "no"

export interface PaymentFilters {
  type: PaymentTypeFilter
  hasInvoice: PaymentInvoiceFilter
  tags: string[]
}

export interface PaymentSortState {
  sortBy: PaymentSortKey
  sortDir: PaymentSortDir
}

export function paymentHasInvoice(payment: Payment): boolean {
  return (payment.invoices?.length ?? 0) > 0 || payment.invoice !== undefined
}

export function derivePaymentTagOptions(payments: Payment[]): string[] {
  const tags = new Set<string>()
  for (const p of payments) {
    if (p.tag && p.tag.length > 0) tags.add(p.tag)
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b))
}

export function filterPayments(
  payments: Payment[],
  filters: PaymentFilters
): Payment[] {
  return payments.filter((p) => {
    if (filters.type !== "all" && p.type !== filters.type) return false
    if (filters.hasInvoice !== "all") {
      const has = paymentHasInvoice(p)
      if (filters.hasInvoice === "yes" && !has) return false
      if (filters.hasInvoice === "no" && has) return false
    }
    if (filters.tags.length > 0 && !filters.tags.includes(p.tag ?? ""))
      return false
    return true
  })
}

function toTime(value: Date | string | undefined): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  return new Date(value).getTime()
}

function compareByKey(a: Payment, b: Payment, key: PaymentSortKey): number {
  switch (key) {
    case "day":
      return toTime(a.date) - toTime(b.date)
    case "type":
      return a.type.localeCompare(b.type)
    case "tag": {
      const at = (a.tag ?? "").toLowerCase()
      const bt = (b.tag ?? "").toLowerCase()
      return at.localeCompare(bt)
    }
    case "total":
      return a.total - b.total
    case "vat":
      return a.vatAmount - b.vatAmount
    case "surcharge":
      return (a.surchargeAmount ?? 0) - (b.surchargeAmount ?? 0)
    case "net":
      return a.netAmount - b.netAmount
    case "invoices": {
      const av = paymentHasInvoice(a) ? 1 : 0
      const bv = paymentHasInvoice(b) ? 1 : 0
      return av - bv
    }
  }
}

export function sortPayments(
  payments: Payment[],
  sortBy: PaymentSortKey,
  sortDir: PaymentSortDir
): Payment[] {
  const copy = [...payments]
  const dir = sortDir === "asc" ? 1 : -1
  copy.sort((a, b) => {
    if (sortBy === "tag") {
      const aEmpty = !a.tag || a.tag.length === 0
      const bEmpty = !b.tag || b.tag.length === 0
      if (aEmpty && !bEmpty) return 1
      if (!aEmpty && bEmpty) return -1
    }
    const primary = compareByKey(a, b, sortBy)
    if (primary !== 0) return primary * dir
    return toTime(b.createdAt) - toTime(a.createdAt)
  })
  return copy
}

export function nextSortState(
  current: PaymentSortState,
  clicked: PaymentSortKey
): PaymentSortState {
  if (current.sortBy === clicked) {
    return {
      sortBy: clicked,
      sortDir: current.sortDir === "asc" ? "desc" : "asc",
    }
  }
  return { sortBy: clicked, sortDir: "desc" }
}
