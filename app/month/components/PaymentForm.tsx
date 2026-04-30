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
import { FetchError } from "@/lib/swr-fetcher"
import Toast from "../../components/Toast"
import PaymentFormFields from "./PaymentFormFields"
import { validateConcepts } from "./paymentUtils"
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

      const result = await createPayment(formData)
      const paymentId = result.id

      // Upload provider bill if outcome payment and file is selected
      if (formData.type === "outcome" && providerBillFile) {
        try {
          await uploadInvoice({ paymentId, file: providerBillFile })
        } catch (uploadErr) {
          console.error(`Error uploading provider bill: ${uploadErr}`)
          let uploadMessage = "Failed to upload provider bill"
          if (
            uploadErr instanceof FetchError &&
            uploadErr.info &&
            typeof uploadErr.info === "object" &&
            "error" in uploadErr.info &&
            typeof (uploadErr.info as { error: unknown }).error === "string"
          ) {
            uploadMessage = (uploadErr.info as { error: string }).error
          } else if (uploadErr instanceof Error) {
            uploadMessage = uploadErr.message
          }
          setUploadError(uploadMessage)
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
      let errorMessage = "An error occurred"
      if (
        err instanceof FetchError &&
        err.info &&
        typeof err.info === "object" &&
        "error" in err.info &&
        typeof (err.info as { error: unknown }).error === "string"
      ) {
        errorMessage = (err.info as { error: string }).error
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
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
        {error && (
          <div
            className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            {error}
          </div>
        )}

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
        />

        {/* Provider Bill Upload (Outcome Only) */}
        {formData.type === "outcome" && (
          <div className="space-y-2">
            <label
              htmlFor={`${id}-providerBill`}
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Provider Bill (Optional)
            </label>
            {uploadError && (
              <div
                className="rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-400"
                role="alert"
              >
                {uploadError}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              id={`${id}-providerBill`}
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {providerBillFile && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Selected: {providerBillFile.name} (
                {(providerBillFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Max file size: 10MB. Only PDF files allowed.
            </p>
          </div>
        )}
      </form>
    </>
  )
}

export default PaymentForm
