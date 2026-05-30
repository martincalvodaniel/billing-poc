"use client"

import type {
  PaymentFilters,
  PaymentInvoiceFilter,
  PaymentTypeFilter,
} from "./monthlyPaymentsView-filters"

const selectClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"

export default function PaymentsFilters({
  tagOptions,
  value,
  onChange,
}: {
  tagOptions: string[]
  value: PaymentFilters
  onChange: (next: PaymentFilters) => void
}) {
  const toggleTag = (tag: string) => {
    const next = value.tags.includes(tag)
      ? value.tags.filter((t) => t !== tag)
      : [...value.tags, tag]
    onChange({ ...value, tags: next })
  }

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <span>Type</span>
        <select
          aria-label="Filter by type"
          className={selectClass}
          value={value.type}
          onChange={(e) =>
            onChange({
              ...value,
              type: e.target.value as PaymentTypeFilter,
            })
          }
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="outcome">Outcome</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <span>Invoice</span>
        <select
          aria-label="Filter by invoice presence"
          className={selectClass}
          value={value.hasInvoice}
          onChange={(e) =>
            onChange({
              ...value,
              hasInvoice: e.target.value as PaymentInvoiceFilter,
            })
          }
        >
          <option value="all">All</option>
          <option value="yes">With invoice</option>
          <option value="no">Without invoice</option>
        </select>
      </label>

      {tagOptions.length > 0 && (
        <fieldset className="flex flex-wrap items-center gap-1.5">
          <legend className="sr-only">Filter by tag</legend>
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Tags:
          </span>
          {tagOptions.map((tag) => {
            const active = value.tags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={active}
                aria-label={`Toggle tag ${tag}`}
                onClick={() => toggleTag(tag)}
                className={
                  active
                    ? "rounded-full border border-blue-500 bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-200 dark:border-blue-400 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900"
                    : "rounded-full border border-zinc-300 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }
              >
                {tag}
              </button>
            )
          })}
          {value.tags.length > 0 && (
            <button
              type="button"
              aria-label="Clear tag filters"
              onClick={() => onChange({ ...value, tags: [] })}
              className="ml-1 rounded-full border border-zinc-300 bg-white px-2.5 py-0.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Clear
            </button>
          )}
        </fieldset>
      )}
    </div>
  )
}
