import useSWR from "swr"
import { fetcher } from "@/lib/swr-fetcher"

export interface EventByPaymentRef {
  id: string
  title: string
  date?: string
  year?: number
  month?: number
  day?: number
  dayOfWeek?: number
  hour?: number
  minute?: number
}

export interface EventByPaymentResponse {
  event: EventByPaymentRef | null
}

export type EventByPaymentKey = readonly ["/api/events/payment", string]

export function buildEventByPaymentKey(paymentId: string): EventByPaymentKey {
  return ["/api/events/payment", paymentId] as const
}

export function buildEventByPaymentUrl(paymentId: string): string {
  return `/api/events/payment/${encodeURIComponent(paymentId)}`
}

export function useEventByPayment(paymentId: string | null) {
  const key = paymentId ? buildEventByPaymentKey(paymentId) : null
  const { data, error, isLoading } = useSWR<EventByPaymentResponse>(
    key,
    paymentId
      ? () => fetcher<EventByPaymentResponse>(buildEventByPaymentUrl(paymentId))
      : null
  )

  return {
    event: data?.event ?? null,
    isLoading,
    error,
  }
}
