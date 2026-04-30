import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/swr-fetcher"
import type { Payment } from "@/lib/types"

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
  return Array.isArray(key) && key[0] === "/api/payments"
}

export interface PaymentsResponse {
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
