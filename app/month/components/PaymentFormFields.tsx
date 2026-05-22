"use client"

import type { PaymentFormData } from "@/lib/types"
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
}: PaymentFormFieldsProps) {
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
        calculateTotal={calculateTotal}
        calculateVatAmount={calculateVatAmount}
        calculateSurchargeAmount={calculateSurchargeAmount}
        calculateNetAmount={calculateNetAmount}
      />
    </div>
  )
}
