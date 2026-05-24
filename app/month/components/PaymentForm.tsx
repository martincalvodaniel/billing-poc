"use client"

import type { Ref } from "react"
import {
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { useUploadInvoice } from "@/lib/hooks/useInvoiceMutations"
import { useCreatePayment } from "@/lib/hooks/usePaymentMutations"
import { ErrorBanner } from "../../components/ErrorBanner"
import Toast from "../../components/Toast"
import PaymentFormFields from "./PaymentFormFields"
import ProviderBillFileInput from "./ProviderBillFileInput"
import { extractPaymentFormError } from "./paymentForm-utils"
import { validateConcepts, validateDiscount } from "./paymentUtils"
import { usePaymentForm } from "./usePaymentForm"

interface PaymentFormProps {
  onPaymentSaved?: (date: string) => void
  ref?: Ref<{
    setFormDate: (dateString: string) => void
    submit: () => void
  } | null>
}

const PaymentForm = function PaymentForm({
  onPaymentSaved,
  ref,
}: PaymentFormProps) {
  const id = useId()
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
  } = usePaymentForm()

  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)

  const { trigger: createPayment } = useCreatePayment()
  const { trigger: uploadInvoice } = useUploadInvoice()

  // Provider bill upload state
  const [providerBillFile, setProviderBillFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    setUploadError(null)

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

      const result = await createPayment({
        ...formData,
        paymentMethod: formData.paymentMethod || undefined,
      })
      const paymentId = result.id

      // Upload provider bill if outcome payment and file is selected
      if (formData.type === "outcome" && providerBillFile) {
        try {
          await uploadInvoice({ paymentId, file: providerBillFile })
        } catch (uploadErr) {
          console.error(`Error uploading provider bill: ${uploadErr}`)
          setUploadError(
            extractPaymentFormError(uploadErr, "Failed to upload provider bill")
          )
          // Continue with success since payment was created
        }
      }

      // Add new tag to available tags if it's not already there
      // Note: availableTags is managed in usePaymentForm hook
      if (formData.tag) {
        setShowTagSuggestions(false)
        setSuggestedTags([])
      }

      // Reset concepts, client, and provider bill file while keeping type and date sticky
      resetForm()
      setProviderBillFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setProviderBillFile(null)
      return
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed")
      setProviderBillFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError("File size exceeds 10MB limit")
      setProviderBillFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setUploadError(null)
    setProviderBillFile(file)
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

        {/* Provider Bill Upload (Outcome Only) */}
        {formData.type === "outcome" && (
          <ProviderBillFileInput
            inputId={`${id}-providerBill`}
            file={providerBillFile}
            uploadError={uploadError}
            onChange={handleFileChange}
            inputRef={fileInputRef}
          />
        )}
      </form>
    </>
  )
}

export default PaymentForm
