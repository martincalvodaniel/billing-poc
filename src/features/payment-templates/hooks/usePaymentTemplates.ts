"use client"

import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"
import type { PaymentTemplate } from "@/lib/domain/entities/payment-template"

const PAYMENT_TEMPLATES_URL = "/api/payment-templates"

export type PaymentTemplatesKey = readonly ["/api/payment-templates"]

interface PaymentTemplatesResponse {
  paymentTemplates: PaymentTemplate[]
}

export function buildPaymentTemplatesKey(): PaymentTemplatesKey {
  return [PAYMENT_TEMPLATES_URL] as const
}

export function buildPaymentTemplatesUrl(): string {
  return PAYMENT_TEMPLATES_URL
}

export function isPaymentTemplatesKey(
  key: unknown
): key is PaymentTemplatesKey {
  return (
    Array.isArray(key) && key.length === 1 && key[0] === PAYMENT_TEMPLATES_URL
  )
}

export interface UsePaymentTemplatesResult {
  paymentTemplates: PaymentTemplate[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<PaymentTemplatesResponse>
}

export function usePaymentTemplates(): UsePaymentTemplatesResult {
  const { data, error, isLoading, mutate } = useSWR<PaymentTemplatesResponse>(
    buildPaymentTemplatesKey(),
    () => fetcher<PaymentTemplatesResponse>(buildPaymentTemplatesUrl())
  )

  return {
    paymentTemplates: data?.paymentTemplates ?? [],
    isLoading,
    error,
    mutate,
  }
}
