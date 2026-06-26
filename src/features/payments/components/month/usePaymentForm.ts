"use client"

import { useCallback, useState } from "react"
import { useTags } from "@/features/payments/hooks/useTags"
import type { PaymentFormData } from "@/lib/domain/entities/payment"
import {
  calculateNetAmount,
  calculateSurchargeAmount,
  calculateVatAmount,
} from "./paymentUtils"

/**
 * Custom hook managing payment form state and handlers
 * Reduces duplication between PaymentForm and PaymentDetailModal
 */
export const usePaymentForm = (
  initialData?: PaymentFormData,
  initialDate?: string
) => {
  const defaultFormData: PaymentFormData = {
    date: initialDate ?? new Date().toISOString().split("T")[0],
    concepts: [{ name: "", amount: 0, quantity: 1 }],
    vat: "21",
    surcharge: "",
    discount: "",
    type: "income",
    tag: "",
    clientId: undefined,
    deliveryNoteRef: "",
    paymentMethod: "",
  }

  const [formData, setFormData] = useState<PaymentFormData>(
    initialData || defaultFormData
  )

  const { tags: availableTags } = useTags(formData.type)

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
      conceptIndex?: number
    ) => {
      const { name, value } = e.target

      // Handle concept-specific fields
      if (conceptIndex !== undefined) {
        setFormData((prev) => {
          const newConcepts = [...prev.concepts]
          if (name === "conceptAmount") {
            newConcepts[conceptIndex].amount = parseFloat(value) || 0
          } else if (name === "conceptName") {
            newConcepts[conceptIndex].name = value
          } else if (name === "conceptQuantity") {
            newConcepts[conceptIndex].quantity = parseFloat(value) || 1
          }
          return { ...prev, concepts: newConcepts }
        })
        return
      }

      // Handle form-level fields
      setFormData((prev) => ({ ...prev, [name]: value }))
    },
    []
  )

  const handleTagSelect = useCallback((tag: string) => {
    setFormData((prev) => ({ ...prev, tag }))
  }, [])

  const handleClientChange = useCallback((clientId: string | undefined) => {
    setFormData((prev) => ({ ...prev, clientId }))
  }, [])

  const addConcept = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      concepts: [{ name: "", amount: 0, quantity: 1 }, ...prev.concepts],
    }))
  }, [])

  const removeConcept = useCallback((index: number) => {
    setFormData((prev) => {
      if (prev.concepts.length > 1) {
        return {
          ...prev,
          concepts: prev.concepts.filter((_, i) => i !== index),
        }
      }
      return prev
    })
  }, [])

  const calculateTotal = useCallback(() => {
    return formData.concepts.reduce(
      (sum, c) => sum + c.amount * (c.quantity || 1),
      0
    )
  }, [formData.concepts])

  const calculateVatAmountValue = useCallback(() => {
    const total = calculateTotal()
    const vatPercentage = parseFloat(formData.vat) || 0
    const surchargePercentage = parseFloat(formData.surcharge || "0") || 0
    return calculateVatAmount(
      total,
      vatPercentage,
      surchargePercentage
    ).toFixed(2)
  }, [formData.vat, formData.surcharge, calculateTotal])

  const calculateSurchargeAmountValue = useCallback(() => {
    const total = calculateTotal()
    const vatPercentage = parseFloat(formData.vat) || 0
    const surchargePercentage = parseFloat(formData.surcharge || "0") || 0
    const result = calculateSurchargeAmount(
      total,
      vatPercentage,
      surchargePercentage
    )
    return result.toFixed(2)
  }, [formData.vat, formData.surcharge, calculateTotal])

  const calculateNetAmountValue = useCallback(() => {
    const total = calculateTotal()
    const vatPercentage = parseFloat(formData.vat) || 0
    const surchargePercentage = parseFloat(formData.surcharge || "0") || 0
    return calculateNetAmount(
      total,
      vatPercentage,
      surchargePercentage
    ).toFixed(2)
  }, [formData.vat, formData.surcharge, calculateTotal])

  const calculateDiscount = useCallback(() => {
    const discount = parseFloat(formData.discount || "0") || 0
    return discount.toFixed(2)
  }, [formData.discount])

  const resetForm = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      concepts: [{ name: "", amount: 0, quantity: 1 }],
      tag: "",
      clientId: undefined,
    }))
  }, [])

  const setFormDate = useCallback((dateString: string) => {
    setFormData((prev) => ({ ...prev, date: dateString }))
  }, [])

  return {
    // State
    formData,
    setFormData,
    availableTags,

    // Handlers
    handleChange,
    handleTagSelect,
    handleClientChange,
    addConcept,
    removeConcept,
    resetForm,
    setFormDate,

    // Calculations
    calculateTotal,
    calculateVatAmount: calculateVatAmountValue,
    calculateSurchargeAmount: calculateSurchargeAmountValue,
    calculateNetAmount: calculateNetAmountValue,
    calculateDiscount,
  }
}
