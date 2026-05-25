"use client"

import FormField from "@/app/components/FormField"
import { type EventFormValues, inputClass } from "./eventFormModal-utils"

interface EventPricingFieldsProps {
  idPrefix: string
  values: EventFormValues
  isSubmitting: boolean
  onChangeField: (
    field: keyof EventFormValues
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export default function EventPricingFields({
  idPrefix,
  values,
  isSubmitting,
  onChangeField,
}: EventPricingFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <FormField
          id={`${idPrefix}-price`}
          label="Price per seat (gross)"
          required
        >
          <input
            id={`${idPrefix}-price`}
            type="number"
            inputMode="numeric"
            min={0}
            step={5}
            value={values.pricePerSeat}
            onChange={onChangeField("pricePerSeat")}
            disabled={isSubmitting}
            required
            aria-label="Price per seat (gross)"
            className={inputClass}
          />
        </FormField>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Price the attendee pays per seat (VAT included). Net and VAT are
          derived using the VAT rate.
        </p>
      </div>
      <div className="space-y-1">
        <FormField id={`${idPrefix}-vat-rate`} label="VAT rate (%)" required>
          <input
            id={`${idPrefix}-vat-rate`}
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            value={values.vatRate}
            onChange={onChangeField("vatRate")}
            disabled={isSubmitting}
            required
            aria-label="VAT rate percentage"
            className={inputClass}
          />
        </FormField>
      </div>
    </div>
  )
}
