"use client"

import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"
import type { Payment } from "@/lib/domain/entities/payment"

export interface UsePaymentsArgs {
  year: number
  month?: number
}

// We use -1 as a sentinel for "no month" so the tuple shape stays stable
// across calls. SWR keys are compared by deep equality, and keeping the
// same arity/shape avoids accidental cache fragmentation.
export type PaymentsKey = readonly [string, number, number]

export function buildPaymentsKey({
  year,
  month,
}: UsePaymentsArgs): PaymentsKey {
  return ["/api/payments", year, month ?? -1] as const
}

export function buildPaymentsUrl({ year, month }: UsePaymentsArgs): string {
  const params = new URLSearchParams()
  params.set("year", String(year))
  if (month !== undefined) {
    params.set("month", String(month))
  }
  return `/api/payments?${params.toString()}`
}

export function isPaymentsKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key.length === 3 &&
    key[0] === "/api/payments" &&
    typeof key[1] === "number"
  )
}

// Single-payment key/url helpers. The key shape (length 2, string id) is
// intentionally distinct from the list key (length 3, numeric year/month) so
// `isPaymentsKey` / `isPaymentKey` discriminate cleanly for cache invalidation.
export type PaymentKey = readonly ["/api/payments", string]

export function buildPaymentKey(id: string): PaymentKey {
  return ["/api/payments", id] as const
}

export function buildPaymentUrl(id: string): string {
  return `/api/payments/${encodeURIComponent(id)}`
}

export function isPaymentKey(
  key: unknown
): key is readonly ["/api/payments", string] {
  return (
    Array.isArray(key) &&
    key.length === 2 &&
    key[0] === "/api/payments" &&
    typeof key[1] === "string"
  )
}

export interface PaymentResponse {
  payment: Payment
}

interface PaymentsResponse {
  payments: Payment[]
}

export interface UsePaymentsResult {
  payments: Payment[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<PaymentsResponse>
}

export function usePayments(args: UsePaymentsArgs): UsePaymentsResult {
  const { data, error, isLoading, mutate } = useSWR<PaymentsResponse>(
    buildPaymentsKey(args),
    () => fetcher<PaymentsResponse>(buildPaymentsUrl(args))
  )

  return {
    payments: data?.payments ?? [],
    isLoading,
    error,
    mutate,
  }
}
