"use client"

import { useId } from "react"
import BinaryToggle, {
  type BinaryToggleValue,
} from "@/components/ui/BinaryToggle"
import { getBadgeToneClass } from "@/components/ui/badge-utils"
import type {
  PaymentFormData,
  PaymentType,
} from "@/lib/domain/entities/payment"

interface PaymentTypeDateRowProps {
  formData: PaymentFormData
  onChangeField: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void
  showDate?: boolean
}

export default function PaymentTypeDateRow({
  formData,
  onChangeField,
  showDate = true,
}: PaymentTypeDateRowProps) {
  const id = useId()
  const gridClassName = showDate ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"
  const handleTypeChange = (value: BinaryToggleValue) => {
    const paymentType: PaymentType = value === "left" ? "income" : "outcome"
    onChangeField({
      target: { name: "type", value: paymentType },
    } as React.ChangeEvent<HTMLInputElement>)
  }

  return (
    <div className={gridClassName}>
      <div className="space-y-2">
        <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Type
        </span>
        <BinaryToggle
          value={formData.type === "income" ? "left" : "right"}
          leftLabel="Income"
          rightLabel="Outcome"
          ariaLabel="Payment type"
          onChange={handleTypeChange}
          className="w-full"
          leftIndicatorClassName={getBadgeToneClass("success")}
          rightIndicatorClassName={getBadgeToneClass("danger")}
          leftSelectedTextClassName="text-green-800 dark:text-green-300"
          rightSelectedTextClassName="text-red-800 dark:text-red-300"
        />
      </div>

      {showDate ? (
        <div className="space-y-2">
          <label
            htmlFor={`${id}-date`}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Date
          </label>
          <input
            type="date"
            id={`${id}-date`}
            name="date"
            value={formData.date}
            onChange={onChangeField}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </div>
      ) : null}
    </div>
  )
}
