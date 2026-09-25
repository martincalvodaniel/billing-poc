import type { InvoiceType } from "@/lib/domain/entities/payment"
import type { InvoiceCounterSnapshot } from "../hooks/useInvoiceCounters"

export const NUMBERED_INVOICE_SERIES = [
  "Invoice",
  "SimpleInvoice",
  "RectificativeInvoice",
  "RectificativeSimpleInvoice",
] as const satisfies readonly InvoiceType[]

export type NumberedInvoiceSeries = (typeof NUMBERED_INVOICE_SERIES)[number]

export interface InvoiceSeriesCounter {
  series: NumberedInvoiceSeries
  label: string
  prefix: string
  lastNumber: number
}

export interface InvoiceCounterYearGroup {
  year: number
  counters: InvoiceSeriesCounter[]
}

const SERIES_DETAILS: Record<
  NumberedInvoiceSeries,
  { label: string; prefix: string }
> = {
  Invoice: { label: "Invoice", prefix: "F" },
  SimpleInvoice: { label: "Simplified invoice", prefix: "FS" },
  RectificativeInvoice: { label: "Corrective invoice", prefix: "FR" },
  RectificativeSimpleInvoice: {
    label: "Corrective simplified invoice",
    prefix: "FSR",
  },
}

function isNumberedInvoiceSeries(
  series: InvoiceType
): series is NumberedInvoiceSeries {
  return NUMBERED_INVOICE_SERIES.some((candidate) => candidate === series)
}

export function groupInvoiceCountersByYear(
  counters: InvoiceCounterSnapshot[]
): InvoiceCounterYearGroup[] {
  const countersByYear = new Map<
    number,
    Partial<Record<NumberedInvoiceSeries, number>>
  >()

  for (const counter of counters) {
    if (!isNumberedInvoiceSeries(counter.series)) continue
    const yearCounters = countersByYear.get(counter.year) ?? {}
    yearCounters[counter.series] = counter.lastNumber
    countersByYear.set(counter.year, yearCounters)
  }

  return Array.from(countersByYear.entries())
    .sort(([leftYear], [rightYear]) => rightYear - leftYear)
    .map(([year, yearCounters]) => ({
      year,
      counters: NUMBERED_INVOICE_SERIES.map((series) => ({
        series,
        ...SERIES_DETAILS[series],
        lastNumber: yearCounters[series] ?? 0,
      })),
    }))
}

export function formatInvoiceCounter(lastNumber: number): string {
  return String(lastNumber).padStart(3, "0")
}
