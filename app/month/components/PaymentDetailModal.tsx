"use client"

import { useId, useRef, useState } from "react"
import { Modal } from "@/app/components/Modal"
import {
  useGenerateInvoice,
  useUploadInvoice,
} from "@/lib/hooks/useInvoiceMutations"
import { useUpdatePayment } from "@/lib/hooks/usePaymentMutations"
import type { InvoiceSeries, Payment, PaymentFormData } from "@/lib/types"
import PaymentFormFields from "./PaymentFormFields"
import PaymentInvoiceSection from "./PaymentInvoiceSection"
import PaymentProviderBillSection from "./PaymentProviderBillSection"
import { extractPaymentError } from "./paymentDetailModal-utils"
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
  const [selectedSeries, setSelectedSeries] = useState<InvoiceSeries>("Invoice")
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
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
      const updatedPayment: Payment = {
        ...payment,
        invoice: data.invoice,
        updatedAt: new Date(),
      }
      onUpdate?.(updatedPayment)
      window.open(data.downloadUrl, "_blank")
    } catch (err) {
      console.error(`Error generating invoice: ${err}`)
      setInvoiceError(extractPaymentError(err, "An error occurred"))
    }
  }

  const handleUploadProviderBill = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed")
      return
    }
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
      const updatedPayment: Payment = {
        ...payment,
        providerBillUrl: data.billUrl,
        providerBillPathname: data.pathname,
        updatedAt: new Date(),
      }
      onUpdate?.(updatedPayment)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error(`Error uploading provider bill: ${err}`)
      setUploadError(extractPaymentError(err, "An error occurred"))
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
      setError(extractPaymentError(err, "An error occurred"))
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Payment"
      maxWidth="lg"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:focus:ring-offset-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            aria-busy={isSaving}
            className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800 dark:focus:ring-offset-zinc-900"
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

        <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {formData.type === "income" ? "Invoice" : "Provider Bill"}
          </h3>

          {formData.type === "income" && (
            <PaymentInvoiceSection
              idPrefix={id}
              payment={payment}
              selectedSeries={selectedSeries}
              onSelectSeries={setSelectedSeries}
              invoiceError={invoiceError}
              isGenerating={isGeneratingInvoice}
              onGenerate={handleGenerateInvoice}
              onDownload={handleDownloadInvoice}
            />
          )}

          {formData.type === "outcome" && (
            <PaymentProviderBillSection
              idPrefix={id}
              payment={payment}
              uploadError={uploadError}
              isUploading={isUploadingBill}
              fileInputRef={fileInputRef}
              onUpload={handleUploadProviderBill}
              onDownload={handleDownloadProviderBill}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
