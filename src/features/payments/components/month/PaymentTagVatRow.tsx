"use client"

import { useCallback, useId } from "react"
import SuggestionInput from "@/components/shared/SuggestionInput"
import NumberStepperInput from "@/components/ui/NumberStepperInput"
import type { PaymentFormData } from "@/lib/domain/entities/payment"

interface PaymentTagVatRowProps {
  formData: PaymentFormData
  availableTags: string[]
  onChangeField: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void
  onTagSelect: (tag: string) => void
}

export default function PaymentTagVatRow({
  formData,
  availableTags,
  onChangeField,
  onTagSelect,
}: PaymentTagVatRowProps) {
  const id = useId()
  const handleTagChange = useCallback(
    (value: string) => {
      onChangeField({
        target: { name: "tag", value },
      } as React.ChangeEvent<HTMLInputElement>)
    },
    [onChangeField]
  )
  const handleVatChange = (value: string) => {
    onChangeField({
      target: { name: "vat", value },
    } as React.ChangeEvent<HTMLInputElement>)
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SuggestionInput
        label="Tag (Optional)"
        ariaLabel="Tag (Optional)"
        name="tag"
        value={formData.tag || ""}
        options={availableTags}
        onChange={handleTagChange}
        onSelect={onTagSelect}
        placeholder="Start typing to see suggestions..."
        leading={
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
            #
          </span>
        }
      />

      <div className="space-y-2">
        <label
          htmlFor={`${id}-vat`}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          VAT (%)
        </label>
        <NumberStepperInput
          id={`${id}-vat`}
          name="vat"
          value={formData.vat}
          onValueChange={handleVatChange}
          step={0.5}
          min={0}
          max={100}
          placeholder="0"
          inputMode="decimal"
          ariaLabel="VAT percentage"
          required
        />
      </div>
    </div>
  )
}
