"use client"

import { useCallback } from "react"
import ClientSelectorField from "@/app/components/ClientSelectorField"
import PaymentMethodDropdown from "@/app/components/PaymentMethodDropdown"
import type {
  PaymentFormData,
  PaymentMethod,
} from "@/lib/domain/entities/payment"
import PaymentAdditionalFields from "./PaymentAdditionalFields"
import PaymentConceptsList from "./PaymentConceptsList"
import PaymentTagVatRow from "./PaymentTagVatRow"
import PaymentTotalsPanel from "./PaymentTotalsPanel"
import PaymentTypeDateRow from "./PaymentTypeDateRow"

interface PaymentDetailFormFieldsProps {
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
 * Payment fields used by Edit/Duplicate modal.
 * Keeps Client next to Payment Method as a modal-specific layout.
 */
export default function PaymentDetailFormFields({
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
}: PaymentDetailFormFieldsProps) {
  const handlePaymentMethodChange = useCallback(
    (value: PaymentMethod | "") => {
      onChangeField({
        target: { name: "paymentMethod", value },
      } as React.ChangeEvent<HTMLSelectElement>)
    },
    [onChangeField]
  )

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

      <div className="grid gap-4 md:grid-cols-2">
        <ClientSelectorField
          value={formData.clientId}
          onChange={(clientId) => onClientChange(clientId)}
          label="Client (Optional)"
          required={false}
        />
        <PaymentMethodDropdown
          value={formData.paymentMethod ?? ""}
          onChange={handlePaymentMethodChange}
        />
      </div>

      <PaymentAdditionalFields
        formData={formData}
        showAdditionalFields={showAdditionalFields}
        onSetShowAdditionalFields={onSetShowAdditionalFields}
        onChangeField={onChangeField}
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
