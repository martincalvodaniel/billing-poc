"use client"
import { useId } from "react"
import type { PaymentFormData } from "@/lib/domain/entities/payment"

interface PaymentAdditionalFieldsProps {
  formData: PaymentFormData
  showAdditionalFields: boolean
  onSetShowAdditionalFields: (show: boolean) => void
  onChangeField: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void
}
export default function PaymentAdditionalFields({
  formData,
  showAdditionalFields,
  onSetShowAdditionalFields,
  onChangeField,
}: PaymentAdditionalFieldsProps) {
  const handleSetShowAdditionalFields = () =>
    onSetShowAdditionalFields(!showAdditionalFields)
  const id = useId()
  return (
    <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
      <button
        type="button"
        onClick={handleSetShowAdditionalFields}
        className="flex w-full items-center justify-between rounded-md bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        <span>Additional Fields</span>
        <svg
          className={`h-4 w-4 transition-transform ${showAdditionalFields ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {showAdditionalFields ? (
        <div className="space-y-4 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800/50">
          <div className="space-y-2">
            <label
              htmlFor={`${id}-deliveryNoteRef`}
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Delivery Note Ref (Optional)
            </label>
            <input
              type="text"
              id={`${id}-deliveryNoteRef`}
              name="deliveryNoteRef"
              value={formData.deliveryNoteRef || ""}
              onChange={onChangeField}
              placeholder="e.g., DN-2024-001"
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor={`${id}-surcharge`}
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Surcharge (%) - Optional
            </label>
            <input
              type="number"
              id={`${id}-surcharge`}
              name="surcharge"
              value={formData.surcharge}
              onChange={onChangeField}
              step="0.1"
              min="-100"
              max="100"
              placeholder="0"
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor={`${id}-discount`}
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Discount (€) - Optional
            </label>
            <input
              type="number"
              id={`${id}-discount`}
              name="discount"
              value={formData.discount || ""}
              onChange={onChangeField}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
