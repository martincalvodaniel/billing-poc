import {
  NUMBERED_INVOICE_SERIES,
  type NumberedInvoiceSeries,
} from "@/lib/domain/entities/invoice"
import { getInvoiceSeriesPrefix } from "@/lib/domain/services/invoice-numbering"
import type {
  GeneratedInvoiceSnapshot,
  InvoiceCounterSnapshot,
} from "../hooks/useInvoiceCounters"

export interface InvoiceSeriesCounter {
  series: NumberedInvoiceSeries
  label: string
  prefix: string
  lastNumber: number
  invoices: GeneratedInvoiceSnapshot[]
}

export interface InvoiceCounterYearGroup {
  year: number
  counters: InvoiceSeriesCounter[]
}

const SERIES_DETAILS: Record<
  NumberedInvoiceSeries,
  { label: string; prefix: string }
> = {
  Invoice: { label: "Invoice", prefix: getInvoiceSeriesPrefix("Invoice") },
  SimpleInvoice: {
    label: "Simplified invoice",
    prefix: getInvoiceSeriesPrefix("SimpleInvoice"),
  },
  RectificativeInvoice: {
    label: "Corrective invoice",
    prefix: getInvoiceSeriesPrefix("RectificativeInvoice"),
  },
  RectificativeSimpleInvoice: {
    label: "Corrective simplified invoice",
    prefix: getInvoiceSeriesPrefix("RectificativeSimpleInvoice"),
  },
}

export function groupInvoiceCountersByYear(
  counters: InvoiceCounterSnapshot[],
  invoices: GeneratedInvoiceSnapshot[] = []
): InvoiceCounterYearGroup[] {
  const countersByYear = new Map<
    number,
    Partial<Record<NumberedInvoiceSeries, number>>
  >()
  const invoicesByYearAndSeries = new Map<string, GeneratedInvoiceSnapshot[]>()

  for (const counter of counters) {
    const yearCounters = countersByYear.get(counter.year) ?? {}
    yearCounters[counter.series] = counter.lastNumber
    countersByYear.set(counter.year, yearCounters)
  }

  for (const invoice of invoices) {
    if (!countersByYear.has(invoice.year)) {
      countersByYear.set(invoice.year, {})
    }
    const key = `${invoice.year}:${invoice.series}`
    const seriesInvoices = invoicesByYearAndSeries.get(key) ?? []
    seriesInvoices.push(invoice)
    invoicesByYearAndSeries.set(key, seriesInvoices)
  }

  return Array.from(countersByYear.entries())
    .sort(([leftYear], [rightYear]) => rightYear - leftYear)
    .map(([year, yearCounters]) => ({
      year,
      counters: NUMBERED_INVOICE_SERIES.map((series) => ({
        series,
        ...SERIES_DETAILS[series],
        lastNumber: yearCounters[series] ?? 0,
        invoices: invoicesByYearAndSeries.get(`${year}:${series}`) ?? [],
      })),
    }))
}

export function formatInvoiceCounter(lastNumber: number): string {
  return String(lastNumber).padStart(3, "0")
}
