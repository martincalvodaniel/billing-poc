"use client"

import { useId } from "react"
import type { PaymentFormData } from "@/lib/domain/entities/payment"
import { useStableCallback } from "@/lib/hooks/useStableCallback"

interface PaymentTagVatRowProps {
  formData: PaymentFormData
  suggestedTags: string[]
  showTagSuggestions: boolean
  onChangeField: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void
  onTagSelect: (tag: string) => void
  onTagBlur: () => void
}

export default function PaymentTagVatRow({
  formData,
  suggestedTags,
  showTagSuggestions,
  onChangeField,
  onTagSelect,
  onTagBlur,
}: PaymentTagVatRowProps) {
  const id = useId()
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="relative space-y-2">
        <label
          htmlFor={`${id}-tag`}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Tag (Optional)
        </label>
        <input
          type="text"
          id={`${id}-tag`}
          name="tag"
          value={formData.tag || ""}
          onChange={onChangeField}
          onBlur={onTagBlur}
          placeholder={
            formData.type === "income"
              ? "e.g., Inc1, Inc2, etc."
              : "e.g., Out1, Out2, etc."
          }
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />

        {showTagSuggestions && suggestedTags.length > 0 ? (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            <ul className="max-h-48 overflow-y-auto py-1">
              {suggestedTags.map((tag) => (
                <TagSuggestion key={tag} tag={tag} onSelect={onTagSelect} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`${id}-vat`}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          VAT (%)
        </label>
        <input
          type="number"
          id={`${id}-vat`}
          name="vat"
          value={formData.vat}
          onChange={onChangeField}
          step="0.5"
          min="0"
          max="100"
          placeholder="0"
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          required
        />
      </div>
    </div>
  )
}

function TagSuggestion({
  tag,
  onSelect,
}: {
  tag: string
  onSelect: (tag: string) => void
}) {
  const handleClick = useStableCallback(() => onSelect(tag))
  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className="w-full px-4 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {tag}
      </button>
    </li>
  )
}
