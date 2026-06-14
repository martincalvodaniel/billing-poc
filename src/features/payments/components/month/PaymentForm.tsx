"use client"
import type { Ref } from "react"
import { useImperativeHandle, useRef, useState } from "react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import Toast from "@/components/ui/Toast"
import { useCreatePayment } from "@/features/payments/hooks/usePaymentMutations"
import type { PaymentFormData } from "@/lib/domain/entities/payment"
import PaymentFormFields from "./PaymentFormFields"
import { extractPaymentFormError } from "./paymentForm-utils"
import { validateConcepts, validateDiscount } from "./paymentUtils"
import { usePaymentForm } from "./usePaymentForm"

interface PaymentFormProps {
  onPaymentSaved?: (date: string) => void
  initialDate?: string
  initialData?: PaymentFormData
  ref?: Ref<{
    setFormDate: (dateString: string) => void
    submit: () => void
  } | null>
}
const PaymentForm = function PaymentForm({
  onPaymentSaved,
  initialDate,
  initialData,
  ref,
}: PaymentFormProps) {
  const handleShowSuccessChange = () => setShowSuccess(false)
  const {
    formData,
    availableTags,
    handleChange,
    handleTagSelect,
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
  } = usePaymentForm(initialData, initialDate)
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
  return (
    <>
      {/* Success Toast Notification */}
      {showSuccess ? (
        <Toast
          message="Payment saved successfully!"
          onClose={handleShowSuccessChange}
        />
      ) : null}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        <PaymentFormFields
          formData={formData}
          availableTags={availableTags}
          showAdditionalFields={showAdditionalFields}
          onSetShowAdditionalFields={setShowAdditionalFields}
          onChangeField={handleChange}
          onTagSelect={handleTagSelect}
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
