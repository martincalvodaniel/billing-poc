"use client"

import { useId } from "react"
import type { PaymentFormData } from "@/lib/domain/entities/payment"
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from "@/lib/domain/entities/payment"
import PaymentAdditionalFields from "./PaymentAdditionalFields"
import PaymentConceptsList from "./PaymentConceptsList"
import PaymentTagVatRow from "./PaymentTagVatRow"
import PaymentTotalsPanel from "./PaymentTotalsPanel"
import PaymentTypeDateRow from "./PaymentTypeDateRow"

interface PaymentFormFieldsProps {
  formData: PaymentFormData
  suggestedTags: string[]
  showTagSuggestions: boolean
  showAdditionalFields: boolean
  onSetShowAdditionalFields: (show: boolean) => void
  onChangeField: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    conceptIndex?: number
  ) => void
  onTagSelect: (tag: string) => void
  onTagBlur: () => void
  onClientChange: (clientId: string | undefined) => void
  onAddConcept: () => void
  onRemoveConcept: (index: number) => void
  calculateTotal: () => number
  calculateVatAmount: () => string
  calculateSurchargeAmount: () => string
  calculateNetAmount: () => string
  calculateDiscount: () => string
}

/**
 * Reusable molecule component for payment form fields.
 * Shared between PaymentForm and PaymentDetailModal.
 */
export default function PaymentFormFields({
  formData,
  suggestedTags,
  showTagSuggestions,
  showAdditionalFields,
  onSetShowAdditionalFields,
  onChangeField,
  onTagSelect,
  onTagBlur,
  onClientChange,
  onAddConcept,
  onRemoveConcept,
  calculateTotal,
  calculateVatAmount,
  calculateSurchargeAmount,
  calculateNetAmount,
  calculateDiscount,
}: PaymentFormFieldsProps) {
  const id = useId()

  return (
    <div className="space-y-4">
      <PaymentTypeDateRow formData={formData} onChangeField={onChangeField} />
      <PaymentTagVatRow
        formData={formData}
        suggestedTags={suggestedTags}
        showTagSuggestions={showTagSuggestions}
        onChangeField={onChangeField}
        onTagSelect={onTagSelect}
        onTagBlur={onTagBlur}
      />
      <div className="space-y-2">
        <label
          htmlFor={`${id}-paymentMethod`}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Payment Method (Optional)
        </label>
        <select
          id={`${id}-paymentMethod`}
          name="paymentMethod"
          value={formData.paymentMethod ?? ""}
          onChange={onChangeField}
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">— Not specified —</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </select>
      </div>
      <PaymentAdditionalFields
        formData={formData}
        showAdditionalFields={showAdditionalFields}
        onSetShowAdditionalFields={onSetShowAdditionalFields}
        onChangeField={onChangeField}
        onClientChange={onClientChange}
      />
      <PaymentConceptsList
        formData={formData}
        onChangeField={onChangeField}
        onAddConcept={onAddConcept}
        onRemoveConcept={onRemoveConcept}
      />
      <PaymentTotalsPanel
        surcharge={formData.surcharge || ""}
        discount={formData.discount || ""}
        calculateTotal={calculateTotal}
        calculateVatAmount={calculateVatAmount}
        calculateSurchargeAmount={calculateSurchargeAmount}
        calculateNetAmount={calculateNetAmount}
        calculateDiscount={calculateDiscount}
      />
    </div>
  )
}
