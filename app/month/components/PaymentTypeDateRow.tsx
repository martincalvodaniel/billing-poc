"use client"

import { useId } from "react"
import type { PaymentFormData } from "@/lib/types"

interface PaymentTypeDateRowProps {
  formData: PaymentFormData
  onChangeField: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void
}

export default function PaymentTypeDateRow({
  formData,
  onChangeField,
}: PaymentTypeDateRowProps) {
  const id = useId()
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <label
          htmlFor={`${id}-type`}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Type
        </label>
        <select
          id={`${id}-type`}
          name="type"
          value={formData.type}
          onChange={onChangeField}
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          required
        >
          <option value="income">Income</option>
          <option value="outcome">Outcome</option>
        </select>
      </div>

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
    </div>
  )
}
