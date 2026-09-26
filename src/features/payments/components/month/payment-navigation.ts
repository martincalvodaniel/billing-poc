import type { Payment } from "@/lib/domain/entities/payment"

export interface PaymentNavigation {
  currentPosition: number
  total: number
  previousPaymentId: string | null
  nextPaymentId: string | null
}

export function getPaymentNavigation(
  displayedPayments: Payment[],
  currentPaymentId: string
): PaymentNavigation | null {
  const paymentIds = displayedPayments.flatMap((payment) =>
    payment._id ? [payment._id] : []
  )
  const currentIndex = paymentIds.indexOf(currentPaymentId)

  if (currentIndex === -1) return null

  return {
    currentPosition: currentIndex + 1,
    total: paymentIds.length,
    previousPaymentId:
      currentIndex > 0 ? (paymentIds[currentIndex - 1] ?? null) : null,
    nextPaymentId:
      currentIndex < paymentIds.length - 1
        ? (paymentIds[currentIndex + 1] ?? null)
        : null,
  }
}
