"use client"

import { useState } from "react"
import {
  useCreatePayment,
  useDeletePayment,
  useUpdatePayment,
} from "@/features/payments/hooks/usePaymentMutations"
import type { Payment, PaymentFormData } from "@/lib/domain/entities/payment"
import { extractPaymentError } from "./paymentDetailModal-utils"
import {
  validateConcepts,
  validateDiscount,
  validateSurcharge,
  validateVat,
} from "./paymentUtils"

interface PaymentCalculators {
  calculateTotal: () => number
  calculateVatAmount: () => string
  calculateSurchargeAmount: () => string
  calculateNetAmount: () => string
}

interface UsePaymentDetailSaveArgs {
  payment: Payment
  isDuplicate: boolean
  formData: PaymentFormData
  calculators: PaymentCalculators
  onUpdate?: (payment: Payment) => void
  onCreate?: (payment: { id: string }) => void
  onDelete?: (paymentId: string) => void
  onClose: () => void
}

/**
 * Encapsulates the validate → create/update/delete flow for the payment
 * detail modal, keeping the component focused on layout.
 */
export function usePaymentDetailSave({
  payment,
  isDuplicate,
  formData,
  calculators,
  onUpdate,
  onCreate,
  onDelete,
  onClose,
}: UsePaymentDetailSaveArgs) {
  const { trigger: updatePayment, isMutating: isUpdating } = useUpdatePayment()
  const { trigger: createPayment, isMutating: isCreating } = useCreatePayment()
  const { trigger: deletePayment, isMutating: isDeleting } = useDeletePayment()
  const isSaving = isDuplicate ? isCreating : isUpdating

  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const {
    calculateTotal,
    calculateVatAmount,
    calculateSurchargeAmount,
    calculateNetAmount,
  } = calculators

  const handleConfirmDelete = async () => {
    if (!payment._id) {
      setDeleteError("Payment ID is missing")
      return
    }

    try {
      const id = payment._id
      await deletePayment({ id })
      setShowDeleteConfirm(false)
      setDeleteError(null)
      onDelete?.(id)
      onClose()
    } catch (err) {
      setDeleteError(extractPaymentError(err, "Failed to delete payment"))
    }
  }

  const handleSave = async () => {
    setError(null)
    if (!formData.date) {
      setError("Date is required")
      return
    }
    const conceptValidation = validateConcepts(formData.concepts)
    if (!conceptValidation.isValid) {
      setError(conceptValidation.error)
      return
    }
    const vatValidation = validateVat(formData.vat)
    if (!vatValidation.isValid) {
      setError(vatValidation.error)
      return
    }
    const surchargeValidation = validateSurcharge(formData.surcharge)
    if (!surchargeValidation.isValid) {
      setError(surchargeValidation.error)
      return
    }
    const conceptsTotal = calculateTotal()
    const discountValidation = validateDiscount(
      formData.discount,
      conceptsTotal
    )
    if (!discountValidation.isValid) {
      setError(discountValidation.error)
      return
    }
    const vatNumber = parseFloat(formData.vat)
    const surchargeNumber = surchargeValidation.isValid
      ? parseFloat(formData.surcharge || "0")
      : 0
    const discountNumber = parseFloat(formData.discount || "0") || 0

    if (isDuplicate) {
      try {
        const created = await createPayment({
          type: formData.type,
          date: formData.date,
          tag: formData.tag || undefined,
          clientId: formData.clientId || undefined,
          concepts: formData.concepts,
          vat: vatNumber,
          surcharge: surchargeNumber,
          discount: discountNumber,
          deliveryNoteRef: formData.deliveryNoteRef || undefined,
          paymentMethod: formData.paymentMethod || undefined,
        })
        onCreate?.({ id: created.id })
        onClose()
      } catch (err) {
        console.error(`Error duplicating payment: ${err}`)
        setError(extractPaymentError(err, "An error occurred"))
      }
      return
    }

    try {
      const responseData = await updatePayment({
        id: payment._id ?? "",
        date: formData.date,
        type: formData.type,
        tag: formData.tag || undefined,
        clientId: formData.clientId || undefined,
        concepts: formData.concepts,
        vat: vatNumber,
        surcharge: surchargeNumber,
        discount: discountNumber,
        deliveryNoteRef: formData.deliveryNoteRef || undefined,
        paymentMethod: formData.paymentMethod || undefined,
      })

      const updatedPayment: Payment = {
        ...payment,
        date: formData.date,
        type: formData.type,
        tag: formData.tag || undefined,
        concepts: formData.concepts,
        vat: responseData.vat ?? vatNumber,
        surcharge:
          responseData.surcharge ??
          (surchargeNumber !== 0 ? surchargeNumber : undefined),
        discount:
          responseData.discount ??
          (discountNumber > 0 ? discountNumber : undefined),
        deliveryNoteRef: formData.deliveryNoteRef || undefined,
        total: responseData.total ?? calculateTotal(),
        vatAmount: responseData.vatAmount ?? parseFloat(calculateVatAmount()),
        surchargeAmount:
          responseData.surchargeAmount ??
          (surchargeNumber !== 0
            ? parseFloat(calculateSurchargeAmount())
            : undefined),
        netAmount: responseData.netAmount ?? parseFloat(calculateNetAmount()),
        paymentMethod: formData.paymentMethod || undefined,
        updatedAt: new Date(),
      }

      onUpdate?.(updatedPayment)
      onClose()
    } catch (err) {
      console.error(`Error updating payment: ${err}`)
      setError(extractPaymentError(err, "An error occurred"))
    }
  }

  return {
    error,
    isSaving,
    isCreating,
    isUpdating,
    isDeleting,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteError,
    setDeleteError,
    handleSave,
    handleConfirmDelete,
  }
}
