"use client"

import { useState } from "react"
import { useSWRConfig } from "swr"
import type { Payment } from "@/lib/domain/entities/payment"
import { isEventsKey } from "@/lib/hooks/useEvents"
import {
  buildPaymentKey,
  buildPaymentUrl,
  type PaymentResponse,
} from "@/lib/hooks/usePayments"
import { fetcher } from "@/lib/swr-fetcher"
import { extractErrorMessage } from "./attendeesPanel-utils"

interface UseAttendeePaymentPreviewArgs {
  onActionError: (message: string) => void
}

/**
 * Manages opening a payment in a detail modal from an attendee row and
 * refreshing events when that payment is deleted.
 */
export function useAttendeePaymentPreview({
  onActionError,
}: UseAttendeePaymentPreviewArgs) {
  const { mutate } = useSWRConfig()
  const [openingPaymentId, setOpeningPaymentId] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const handleOpenPayment = async (paymentId: string) => {
    setOpeningPaymentId(paymentId)
    try {
      const data = await mutate<PaymentResponse>(
        buildPaymentKey(paymentId),
        fetcher<PaymentResponse>(buildPaymentUrl(paymentId)),
        { revalidate: false, populateCache: true }
      )
      if (!data) throw new Error("Payment not found")
      setSelectedPayment(data.payment)
    } catch (error) {
      onActionError(extractErrorMessage(error, "Failed to open payment"))
    } finally {
      setOpeningPaymentId(null)
    }
  }

  const handleSelectedPaymentDeleted = () => {
    setSelectedPayment(null)
    void mutate((key) => isEventsKey(key), undefined, {
      revalidate: true,
    })
  }

  return {
    openingPaymentId,
    selectedPayment,
    setSelectedPayment,
    handleOpenPayment,
    handleSelectedPaymentDeleted,
  }
}
