"use client"
import { useCallback } from "react"
import ClientSelectorField from "@/components/shared/ClientSelectorField"
import PaymentMethodDropdown from "@/components/shared/PaymentMethodDropdown"
import type {
  PaymentFormData,
  PaymentMethod,
} from "@/lib/domain/entities/payment"
import PaymentAdditionalFields from "./PaymentAdditionalFields"
import PaymentConceptsList from "./PaymentConceptsList"
import PaymentTagVatRow from "./PaymentTagVatRow"
import PaymentTotalsPanel from "./PaymentTotalsPanel"
import PaymentTypeDateRow from "./PaymentTypeDateRow"

interface PaymentFormFieldsProps {
  formData: PaymentFormData
  availableTags: string[]
  showAdditionalFields: boolean
  onSetShowAdditionalFields: (show: boolean) => void
  onChangeField: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    conceptIndex?: number
  ) => void
  onTagSelect: (tag: string) => void
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
  availableTags,
  showAdditionalFields,
  onSetShowAdditionalFields,
  onChangeField,
  onTagSelect,
  onClientChange,
  onAddConcept,
  onRemoveConcept,
  calculateTotal,
  calculateVatAmount,
  calculateSurchargeAmount,
  calculateNetAmount,
  calculateDiscount,
}: PaymentFormFieldsProps) {
  function handleClientChange(
    clientId: Parameters<
      NonNullable<React.ComponentProps<typeof ClientSelectorField>["onChange"]>
    >[0]
  ) {
    return onClientChange(clientId)
  }
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
        availableTags={availableTags}
        onChangeField={onChangeField}
        onTagSelect={onTagSelect}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ClientSelectorField
          value={formData.clientId}
          onChange={handleClientChange}
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
