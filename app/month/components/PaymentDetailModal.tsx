"use client"

import { useState } from "react"
import { ErrorBanner } from "@/app/components/ErrorBanner"
import { Modal } from "@/app/components/Modal"
import { useGenerateInvoice } from "@/lib/hooks/useInvoiceMutations"
import {
  useCreatePayment,
  useUpdatePayment,
} from "@/lib/hooks/usePaymentMutations"
import type { InvoiceSeries, Payment, PaymentFormData } from "@/lib/types"
import PaymentFormFields from "./PaymentFormFields"
import PaymentInvoiceSection from "./PaymentInvoiceSection"
import PaymentProviderBillSection from "./PaymentProviderBillSection"
import { buildDuplicateSeed } from "./paymentDetailModal-seed"
import { extractPaymentError } from "./paymentDetailModal-utils"
import {
  validateConcepts,
  validateDiscount,
  validateSurcharge,
  validateVat,
} from "./paymentUtils"
import { usePaymentForm } from "./usePaymentForm"

interface PaymentDetailModalProps {
  payment: Payment
  mode?: "edit" | "duplicate"
  onClose: () => void
  onUpdate?: (payment: Payment) => void
  onCreate?: (payment: { id: string }) => void
}

export default function PaymentDetailModal({
  payment,
  mode = "edit",
  onClose,
  onUpdate,
  onCreate,
}: PaymentDetailModalProps) {
  const isDuplicate = mode === "duplicate"
  const initialFormData: PaymentFormData = isDuplicate
    ? buildDuplicateSeed(payment)
    : {
        type: payment.type,
        date: payment.date,
        concepts: payment.concepts || [{ name: "", amount: 0, quantity: 1 }],
        vat: payment.vat.toString(),
        surcharge: payment.surcharge?.toString() || "",
        discount: payment.discount?.toString() || "",
        tag: payment.tag || "",
        clientId: payment.clientId?.toString() || undefined,
        deliveryNoteRef: payment.deliveryNoteRef || "",
        paymentMethod: payment.paymentMethod ?? "",
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
    calculateDiscount,
  } = usePaymentForm(initialFormData)

  const { trigger: updatePayment, isMutating: isUpdating } = useUpdatePayment()
  const { trigger: createPayment, isMutating: isCreating } = useCreatePayment()
  const isSaving = isDuplicate ? isCreating : isUpdating
  const { trigger: generateInvoice, isMutating: isGeneratingInvoice } =
    useGenerateInvoice()

  const [error, setError] = useState<string | null>(null)
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  const handleGenerateInvoice = async (series: InvoiceSeries) => {
    setInvoiceError(null)
    try {
      const data = await generateInvoice({
        paymentId: payment._id?.toString() ?? "",
        series,
      })
      const updatedPayment: Payment = {
        ...payment,
        invoice: undefined,
        invoices: data.invoices,
        updatedAt: new Date(),
      }
      onUpdate?.(updatedPayment)
      window.open(data.downloadUrl, "_blank")
    } catch (err) {
      console.error(`Error generating invoice: ${err}`)
      setInvoiceError(extractPaymentError(err, "An error occurred"))
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
        id: payment._id?.toString() ?? "",
        date: formData.date,
        type: formData.type,
        tag: formData.tag || undefined,
        clientId: formData.clientId || undefined,
        concepts: formData.concepts,
        vat: vatNumber,
        // Send raw surcharge (including 0) so the API recompute uses the
        // user's current value rather than falling back to the previously
        // stored surcharge. The repository unsets the field when 0.
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
          (surchargeNumber > 0 ? surchargeNumber : undefined),
        discount:
          responseData.discount ??
          (discountNumber > 0 ? discountNumber : undefined),
        deliveryNoteRef: formData.deliveryNoteRef || undefined,
        total: responseData.total ?? calculateTotal(),
        vatAmount: responseData.vatAmount ?? parseFloat(calculateVatAmount()),
        surchargeAmount:
          responseData.surchargeAmount ??
          (surchargeNumber > 0
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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isDuplicate ? "Duplicate Payment" : "Edit Payment"}
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
            {isDuplicate
              ? isCreating
                ? "Creating..."
                : "Create Payment"
              : isUpdating
                ? "Saving..."
                : "Save Changes"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <ErrorBanner>{error}</ErrorBanner>}

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
          calculateDiscount={calculateDiscount}
        />

        <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {formData.type === "income" ? "Invoice" : "Provider Bill"}
          </h3>

          {!isDuplicate && formData.type === "income" && (
            <PaymentInvoiceSection
              payment={payment}
              invoiceError={invoiceError}
              isGenerating={isGeneratingInvoice}
              onGenerate={handleGenerateInvoice}
            />
          )}

          {!isDuplicate && formData.type === "outcome" && (
            <PaymentProviderBillSection payment={payment} onUpdate={onUpdate} />
          )}

          {isDuplicate && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {formData.type === "income"
                ? "Invoice generation will be available after the duplicated payment is created."
                : "Provider bill upload will be available after the duplicated payment is created."}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
