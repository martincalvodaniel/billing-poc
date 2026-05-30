"use client"

import type { Ref } from "react"
import { useCallback, useImperativeHandle, useRef, useState } from "react"
import { useCreatePayment } from "@/lib/hooks/usePaymentMutations"
import { ErrorBanner } from "../../components/ErrorBanner"
import Toast from "../../components/Toast"
import PaymentFormFields from "./PaymentFormFields"
import { extractPaymentFormError } from "./paymentForm-utils"
import { validateConcepts, validateDiscount } from "./paymentUtils"
import { usePaymentForm } from "./usePaymentForm"

interface PaymentFormProps {
  onPaymentSaved?: (date: string) => void
  initialDate?: string
  ref?: Ref<{
    setFormDate: (dateString: string) => void
    submit: () => void
  } | null>
}

const PaymentForm = function PaymentForm({
  onPaymentSaved,
  initialDate,
  ref,
}: PaymentFormProps) {
  const {
    formData,
    suggestedTags,
    showTagSuggestions,
    setSuggestedTags,
    setShowTagSuggestions,
    handleChange,
    handleTagSelect,
    handleTagBlur,
    handleClientChange,
    addConcept,
    removeConcept,
    resetForm,
    setFormDate,
    calculateTotal,
    calculateVatAmount,
    calculateSurchargeAmount,
    calculateNetAmount,
    calculateDiscount,
  } = usePaymentForm(undefined, initialDate)

  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)

  const { trigger: createPayment } = useCreatePayment()
  const formRef = useRef<HTMLFormElement>(null)

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    setFormDate,
    submit: () => {
      formRef.current?.requestSubmit()
    },
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Validate concepts
      const validation = validateConcepts(formData.concepts)
      if (!validation.isValid) {
        throw new Error(validation.error || "Validation failed")
      }

      const conceptsTotal = calculateTotal()
      const discountValidation = validateDiscount(
        formData.discount,
        conceptsTotal
      )
      if (!discountValidation.isValid) {
        throw new Error(discountValidation.error || "Validation failed")
      }

      await createPayment({
        ...formData,
        paymentMethod: formData.paymentMethod || undefined,
      })

      // Add new tag to available tags if it's not already there
      // Note: availableTags is managed in usePaymentForm hook
      if (formData.tag) {
        setShowTagSuggestions(false)
        setSuggestedTags([])
      }

      // Reset concepts and client while keeping type and date sticky
      resetForm()

      // Show success toast
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)

      onPaymentSaved?.(formData.date)
    } catch (err) {
      setError(extractPaymentFormError(err, "An error occurred"))
      console.error(`Error saving payment: ${err}`)
    }
  }

  const handleFormFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    conceptIndex?: number
  ) => {
    handleChange(e, conceptIndex)

    // Handle tag suggestions with debounce (managed in hook, but keep dropdown state in sync here)
    if (e.target.name === "tag") {
      setShowTagSuggestions(true)
    }
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      // Don't submit if tag dropdown is open (ENTER should select tag)
      if (showTagSuggestions) {
        return
      }

      if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        const submitButton = (e.currentTarget as HTMLFormElement).querySelector(
          'button[type="submit"]'
        ) as HTMLButtonElement
        submitButton?.click()
      }
    },
    [showTagSuggestions]
  )

  return (
    <>
      {/* Success Toast Notification */}
      {showSuccess && (
        <Toast
          message="Payment saved successfully!"
          onClose={() => setShowSuccess(false)}
        />
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="space-y-4"
      >
        {error && <ErrorBanner>{error}</ErrorBanner>}

        <PaymentFormFields
          formData={formData}
          suggestedTags={suggestedTags}
          showTagSuggestions={showTagSuggestions}
          showAdditionalFields={showAdditionalFields}
          onSetShowAdditionalFields={setShowAdditionalFields}
          onChangeField={handleFormFieldChange}
          onTagSelect={handleTagSelect}
          onTagBlur={handleTagBlur}
          onClientChange={handleClientChange}
          onAddConcept={addConcept}
          onRemoveConcept={removeConcept}
          calculateTotal={calculateTotal}
          calculateVatAmount={calculateVatAmount}
          calculateSurchargeAmount={calculateSurchargeAmount}
          calculateNetAmount={calculateNetAmount}
          calculateDiscount={calculateDiscount}
        />
      </form>
    </>
  )
}

export default PaymentForm
