"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"
import type {
  GeneratedInvoiceRecord,
  InvoiceCounter,
} from "@/lib/domain/entities/invoice"

export type InvoiceCounterSnapshot = Pick<
  InvoiceCounter,
  "series" | "year" | "lastNumber"
>

export type InvoiceCountersKey = readonly ["/api/invoices/counters"]

export type GeneratedInvoiceSnapshot = Omit<
  GeneratedInvoiceRecord,
  "generatedAt"
> & {
  generatedAt: string
}

export interface InvoiceCountersResponse {
  counters: InvoiceCounterSnapshot[]
  invoices: GeneratedInvoiceSnapshot[]
}

const EMPTY_COUNTERS: InvoiceCounterSnapshot[] = []
const EMPTY_INVOICES: GeneratedInvoiceSnapshot[] = []

export function buildInvoiceCountersKey(): InvoiceCountersKey {
  return ["/api/invoices/counters"] as const
}

export function buildInvoiceCountersUrl(): string {
  return "/api/invoices/counters"
}

export function isInvoiceCountersKey(key: unknown): key is InvoiceCountersKey {
  return (
    Array.isArray(key) &&
    key.length === 1 &&
    key[0] === "/api/invoices/counters"
  )
}

export function useInvoiceCounters() {
  const { data, error, isLoading, mutate } = useSWR<InvoiceCountersResponse>(
    buildInvoiceCountersKey(),
    () => fetcher<InvoiceCountersResponse>(buildInvoiceCountersUrl())
  )

  return {
    counters: data?.counters ?? EMPTY_COUNTERS,
    invoices: data?.invoices ?? EMPTY_INVOICES,
    isLoading,
    error,
    mutate,
  }
}
