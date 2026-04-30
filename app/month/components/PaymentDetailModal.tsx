"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import Modal from "@/app/components/Modal"
import {
  useGenerateInvoice,
  useUploadInvoice,
} from "@/lib/hooks/useInvoiceMutations"
import { useUpdatePayment } from "@/lib/hooks/usePaymentMutations"
import { FetchError } from "@/lib/swr-fetcher"
import type { InvoiceSeries, Payment, PaymentFormData } from "@/lib/types"
import PaymentFormFields from "./PaymentFormFields"
import {
  validateConcepts,
  validateSurcharge,
  validateVat,
} from "./paymentUtils"
import { usePaymentForm } from "./usePaymentForm"

interface PaymentDetailModalProps {
  payment: Payment
  onClose: () => void
  onUpdate?: (payment: Payment) => void
}

export default function PaymentDetailModal({
  payment,
  onClose,
  onUpdate,
}: PaymentDetailModalProps) {
  const id = useId()
  // Initialize form with payment data
  const initialFormData: PaymentFormData = {
    type: payment.type,
    date: payment.date,
    concepts: payment.concepts || [{ name: "", amount: 0, quantity: 1 }],
    vat: payment.vat.toString(),
    surcharge: payment.surcharge?.toString() || "",
    tag: payment.tag || "",
    clientId: payment.clientId?.toString() || undefined,
    deliveryNoteRef: payment.deliveryNoteRef || "",
  }

  const {
    formData,
    suggestedTags,
    showTagSuggestions,
    handleChange,
    handleTagSelect,
    handleTagBlur,
    handleClientChange,
    addConcept,
    removeConcept,
    calculateTotal,
    calculateVatAmount,
    calculateSurchargeAmount,
    calculateNetAmount,
  } = usePaymentForm(initialFormData)

  const { trigger: updatePayment, isMutating: isSaving } = useUpdatePayment()
  const { trigger: generateInvoice, isMutating: isGeneratingInvoice } =
    useGenerateInvoice()
  const { trigger: uploadInvoice, isMutating: isUploadingBill } =
    useUploadInvoice()

  const [error, setError] = useState<string | null>(null)
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)

  // Invoice generation state
  const [selectedSeries, setSelectedSeries] = useState<InvoiceSeries>("Invoice")
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  // Provider bill upload state
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadInvoice = () => {
    window.open(`/api/invoices/${payment._id?.toString()}`, "_blank")
  }

  const handleDownloadProviderBill = () => {
    window.open(`/api/invoices/${payment._id?.toString()}`, "_blank")
  }

  const handleGenerateInvoice = async () => {
    setInvoiceError(null)

    try {
      const data = await generateInvoice({
        paymentId: payment._id?.toString() ?? "",
        series: selectedSeries,
      })

      // Update the local payment with invoice metadata
      const updatedPayment: Payment = {
        ...payment,
        invoice: data.invoice,
        updatedAt: new Date(),
      }

      onUpdate?.(updatedPayment)

      // Open the invoice in a new tab
      window.open(data.downloadUrl, "_blank")
    } catch (err) {
      console.error(`Error generating invoice: ${err}`)
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
      setInvoiceError(errorMessage)
    }
  }

  const handleUploadProviderBill = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed")
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError("File size exceeds 10MB limit")
      return
    }

    setUploadError(null)

    try {
      const data = await uploadInvoice({
        paymentId: payment._id?.toString() ?? "",
        file,
      })

      // Update the local payment with provider bill URL
      const updatedPayment: Payment = {
        ...payment,
        providerBillUrl: data.billUrl,
        providerBillPathname: data.pathname,
        updatedAt: new Date(),
      }

      onUpdate?.(updatedPayment)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error(`Error uploading provider bill: ${err}`)
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
      setUploadError(errorMessage)
    }
  }

  const handleSave = async () => {
    setError(null)

    // Validate date
    if (!formData.date) {
      setError("Date is required")
      return
    }

    // Validate concepts
    const conceptValidation = validateConcepts(formData.concepts)
    if (!conceptValidation.isValid) {
      setError(conceptValidation.error)
      return
    }

    // Validate VAT
    const vatValidation = validateVat(formData.vat)
    if (!vatValidation.isValid) {
      setError(vatValidation.error)
      return
    }

    // Validate surcharge
    const surchargeValidation = validateSurcharge(formData.surcharge)
    if (!surchargeValidation.isValid) {
      setError(surchargeValidation.error)
      return
    }

    const vatNumber = parseFloat(formData.vat)
    const surchargeNumber = surchargeValidation.isValid
      ? parseFloat(formData.surcharge || "0")
      : 0

    try {
      const responseData = await updatePayment({
        id: payment._id?.toString() ?? "",
        date: formData.date,
        type: formData.type,
        tag: formData.tag || undefined,
        clientId: formData.clientId || undefined,
        concepts: formData.concepts,
        vat: vatNumber,
        surcharge: surchargeNumber > 0 ? surchargeNumber : undefined,
        deliveryNoteRef: formData.deliveryNoteRef || undefined,
      })

      // Reconstruct the updated payment with response data
      const updatedPayment: Payment = {
        ...payment,
        date: formData.date,
        type: formData.type,
        tag: formData.tag || undefined,
        concepts: formData.concepts,
        vat: responseData.vat ?? vatNumber,
        surcharge:
          responseData.surcharge ??
          (surchargeNumber > 0 ? surchargeNumber : undefined),
        deliveryNoteRef: formData.deliveryNoteRef || undefined,
        total: responseData.total ?? calculateTotal(),
        vatAmount: responseData.vatAmount ?? parseFloat(calculateVatAmount()),
        surchargeAmount:
          responseData.surchargeAmount ??
          (surchargeNumber > 0
            ? parseFloat(calculateSurchargeAmount())
            : undefined),
        netAmount: responseData.netAmount ?? parseFloat(calculateNetAmount()),
        updatedAt: new Date(),
      }

      onUpdate?.(updatedPayment)
      onClose()
    } catch (err) {
      console.error(`Error updating payment: ${err}`)
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
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Payment"
      maxWidth="lg"
      closeOnEscape={true}
      closeOnBackdropClick={true}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
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
          onChangeField={handleChange}
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

        {/* Invoice/Provider Bill Section */}
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {formData.type === "income" ? "Invoice" : "Provider Bill"}
          </h3>

          {/* Income: Invoice Generation */}
          {formData.type === "income" && (
            <div className="space-y-3">
              {payment.invoice ? (
                <div className="space-y-2">
                  <div className="text-sm text-zinc-700 dark:text-zinc-300">
                    <p>
                      <span className="font-medium">Series:</span>{" "}
                      {payment.invoice.series}
                    </p>
                    <p>
                      <span className="font-medium">Number:</span>{" "}
                      {String(payment.invoice.number).padStart(6, "0")}
                    </p>
                    <p>
                      <span className="font-medium">Generated:</span>{" "}
                      {new Date(payment.invoice.generatedAt).toLocaleDateString(
                        "es-ES"
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadInvoice}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Invoice
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoiceError && (
                    <div
                      className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      role="alert"
                    >
                      {invoiceError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label
                      htmlFor={`${id}-invoice-series`}
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Invoice Series
                    </label>
                    <select
                      id={`${id}-invoice-series`}
                      value={selectedSeries}
                      onChange={(e) =>
                        setSelectedSeries(e.target.value as InvoiceSeries)
                      }
                      disabled={isGeneratingInvoice}
                      className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="Invoice">Invoice</option>
                      <option value="RectificativeInvoice">
                        Rectificative Invoice
                      </option>
                      <option value="SimpleInvoice">Simple Invoice</option>
                      <option value="RectificativeSimpleInvoice">
                        Rectificative Simple Invoice
                      </option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateInvoice}
                    disabled={isGeneratingInvoice}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    {isGeneratingInvoice ? "Generating..." : "Generate Invoice"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Outcome: Provider Bill Upload */}
          {formData.type === "outcome" && (
            <div className="space-y-3">
              {payment.providerBillUrl ? (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    Provider bill uploaded
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadProviderBill}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Provider Bill
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadError && (
                    <div
                      className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      role="alert"
                    >
                      {uploadError}
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleUploadProviderBill}
                      disabled={isUploadingBill}
                      className="hidden"
                      id={`${id}-provider-bill-upload`}
                    />
                    <label
                      htmlFor={`${id}-provider-bill-upload`}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      {isUploadingBill
                        ? "Uploading..."
                        : "Upload Provider Bill (PDF)"}
                    </label>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Max file size: 10MB. Only PDF files allowed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
