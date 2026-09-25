import type {
  GeneratedInvoiceRecord,
  InvoiceCounter,
  NumberedInvoiceSeries,
} from "../entities/invoice"
import type { InvoiceCounterRepository } from "../ports/invoice-counter-repository"
import type { PaymentRepository } from "../ports/payment-repository"
import {
  collectGeneratedInvoices,
  countAffectedPayments,
  getInvoicesRemovedByReduction,
} from "./invoice-numbering"

type CounterStore = Pick<
  InvoiceCounterRepository,
  "findAll" | "getCurrentNumber" | "setCurrentNumber"
>

type InvoicePaymentStore = Pick<
  PaymentRepository,
  "findAllWithGeneratedInvoices" | "removeGeneratedInvoices"
>

export interface InvoiceOverview {
  counters: InvoiceCounter[]
  invoices: GeneratedInvoiceRecord[]
}

export interface InvoiceReductionTarget {
  series: NumberedInvoiceSeries
  year: number
  newLastNumber: number
}

export interface InvoiceReductionPreview extends InvoiceReductionTarget {
  currentNumber: number
  invoices: GeneratedInvoiceRecord[]
  affectedPaymentCount: number
}

export type InvoiceReductionFailureReason =
  | "counter-not-found"
  | "not-a-reduction"
  | "stale-preview"
  | "payments-changed"

export type InvoiceReductionResult =
  | {
      ok: true
      preview: InvoiceReductionPreview
    }
  | {
      ok: false
      reason: InvoiceReductionFailureReason
      message: string
    }

export async function getInvoiceOverview(
  counters: CounterStore,
  payments: InvoicePaymentStore
): Promise<InvoiceOverview> {
  const [counterRecords, invoicePayments] = await Promise.all([
    counters.findAll(),
    payments.findAllWithGeneratedInvoices(),
  ])
  return {
    counters: counterRecords,
    invoices: collectGeneratedInvoices(invoicePayments),
  }
}

export async function previewInvoiceCounterReduction(
  counters: CounterStore,
  payments: InvoicePaymentStore,
  target: InvoiceReductionTarget
): Promise<InvoiceReductionResult> {
  const [currentNumber, invoicePayments] = await Promise.all([
    counters.getCurrentNumber(target.series, target.year),
    payments.findAllWithGeneratedInvoices(),
  ])

  if (currentNumber === 0) {
    return {
      ok: false,
      reason: "counter-not-found",
      message: "No invoice counter exists for this series and year",
    }
  }
  if (target.newLastNumber >= currentNumber) {
    return {
      ok: false,
      reason: "not-a-reduction",
      message: `The new number must be lower than ${currentNumber}`,
    }
  }

  const invoices = getInvoicesRemovedByReduction(
    collectGeneratedInvoices(invoicePayments),
    target.series,
    target.year,
    target.newLastNumber
  )
  return {
    ok: true,
    preview: {
      ...target,
      currentNumber,
      invoices,
      affectedPaymentCount: countAffectedPayments(invoices),
    },
  }
}

export async function reduceInvoiceCounter(
  counters: CounterStore,
  payments: InvoicePaymentStore,
  target: InvoiceReductionTarget & { expectedCurrentNumber: number }
): Promise<InvoiceReductionResult> {
  const previewResult = await previewInvoiceCounterReduction(
    counters,
    payments,
    target
  )
  if (!previewResult.ok) return previewResult

  const { preview } = previewResult
  if (preview.currentNumber !== target.expectedCurrentNumber) {
    return {
      ok: false,
      reason: "stale-preview",
      message: "Invoice numbering changed. Review the impact again.",
    }
  }

  const invoiceIds = preview.invoices.map((invoice) => invoice.id)
  if (invoiceIds.length > 0) {
    const updatedPayments = await payments.removeGeneratedInvoices(invoiceIds)
    if (updatedPayments !== preview.affectedPaymentCount) {
      return {
        ok: false,
        reason: "payments-changed",
        message: "Affected payments changed. Review the impact again.",
      }
    }
  }

  const counterUpdated = await counters.setCurrentNumber(
    target.series,
    target.year,
    target.expectedCurrentNumber,
    target.newLastNumber
  )
  if (!counterUpdated) {
    return {
      ok: false,
      reason: "stale-preview",
      message: "Invoice numbering changed. Review the impact again.",
    }
  }

  return { ok: true, preview }
}
