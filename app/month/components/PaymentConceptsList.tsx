"use client"

import { useId } from "react"
import type { PaymentFormData } from "@/lib/domain/entities/payment"

interface PaymentConceptsListProps {
  formData: PaymentFormData
  onChangeField: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    conceptIndex?: number
  ) => void
  onAddConcept: () => void
  onRemoveConcept: (index: number) => void
}

export default function PaymentConceptsList({
  formData,
  onChangeField,
  onAddConcept,
  onRemoveConcept,
}: PaymentConceptsListProps) {
  const id = useId()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Payment Components
        </span>
        <button
          type="button"
          onClick={onAddConcept}
          className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          +
        </button>
      </div>

      {formData.concepts.map((concept, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: concepts have no stable unique ID
          key={index}
          className="relative grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50 sm:grid-cols-12"
        >
          <div className="space-y-2 col-span-12 sm:col-span-7">
            <label
              htmlFor={`${id}-conceptName-${index}`}
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Name
            </label>
            <input
              type="text"
              id={`${id}-conceptName-${index}`}
              name="conceptName"
              value={concept.name || ""}
              onChange={(e) => onChangeField(e, index)}
              placeholder="e.g., Service, Product..."
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </div>
          <div className="space-y-2 col-span-6 sm:col-span-3">
            <label
              htmlFor={`${id}-conceptAmount-${index}`}
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Amount (€)
            </label>
            <input
              type="number"
              id={`${id}-conceptAmount-${index}`}
              name="conceptAmount"
              value={concept.amount || ""}
              onChange={(e) => onChangeField(e, index)}
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </div>
          <div className="space-y-2 col-span-6 sm:col-span-2">
            <label
              htmlFor={`${id}-conceptQuantity-${index}`}
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Quantity
            </label>
            <input
              type="number"
              id={`${id}-conceptQuantity-${index}`}
              name="conceptQuantity"
              value={concept.quantity ?? 1}
              onChange={(e) => onChangeField(e, index)}
              step="1"
              min="1"
              placeholder="1"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          {formData.concepts.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveConcept(index)}
              className="absolute right-2 top-2 flex h-5 w-5 flex-shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              aria-label="Remove component"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
