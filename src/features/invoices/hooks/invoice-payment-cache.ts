"use client"

import type { ScopedMutator } from "swr"
import {
  isPaymentKey,
  isPaymentsKey,
  type PaymentResponse,
  type PaymentsResponse,
  updatePaymentInResponse,
} from "@/features/payments/hooks/usePayments"
import type { Payment } from "@/lib/domain/entities/payment"

type PaymentUpdater = (payment: Payment) => Payment

export async function updateInvoicePaymentCaches(
  mutate: ScopedMutator,
  paymentId: string,
  update: PaymentUpdater
): Promise<void> {
  const isTargetPaymentKey = (key: unknown): boolean =>
    isPaymentKey(key) && key[1] === paymentId

  await Promise.all([
    mutate<PaymentsResponse>(
      isPaymentsKey,
      (response) => updatePaymentInResponse(response, paymentId, update),
      { revalidate: false }
    ),
    mutate<PaymentResponse>(
      isTargetPaymentKey,
      (response) =>
        response
          ? { ...response, payment: update(response.payment) }
          : response,
      { revalidate: false }
    ),
  ])

  await Promise.all([mutate(isPaymentsKey), mutate(isTargetPaymentKey)])
}
