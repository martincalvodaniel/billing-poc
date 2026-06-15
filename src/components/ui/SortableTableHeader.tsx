"use client"

import { useStableCallback } from "@/hooks/useStableCallback"
import type { SortDirection, SortState } from "@/lib/utils/sort-state"

export type ColumnAlign = "left" | "right"

function SortIndicator({
  active,
  sortDir,
}: {
  active: boolean
  sortDir: SortDirection
}) {
  if (!active) {
    return (
      <svg
        aria-hidden="true"
        className="h-3 w-3 text-zinc-400 dark:text-zinc-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l4-4 4 4M8 15l4 4 4-4"
        />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="h-3 w-3 text-zinc-700 dark:text-zinc-200"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={sortDir === "asc" ? "M8 15l4-4 4 4" : "M8 9l4 4 4-4"}
      />
    </svg>
  )
}

interface SortableTableHeaderProps<TKey extends string> {
  label: string
  sortKey: TKey
  sort?: SortState<TKey>
  onSortChange?: (key: TKey) => void
  align: ColumnAlign
  className?: string
  buttonClassName?: string
}

export function SortableTableHeader<TKey extends string>({
  label,
  sortKey,
  sort,
  onSortChange,
  align,
  className,
  buttonClassName,
}: SortableTableHeaderProps<TKey>) {
  const handleSort = useStableCallback(() => onSortChange?.(sortKey))
  const active = sort?.sortBy === sortKey
  const sortDir = sort?.sortDir ?? "asc"
  const ariaSort: "ascending" | "descending" | "none" = active
    ? sortDir === "asc"
      ? "ascending"
      : "descending"
    : "none"
  const justify = align === "right" ? "justify-end" : "justify-start"
  const alignClass = align === "right" ? "text-right" : "text-left"
  const thClassName =
    className ??
    `px-6 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50 ${alignClass}`
  const triggerClassName =
    buttonClassName ??
    `inline-flex w-full items-center gap-1 rounded text-inherit focus:outline-none focus:ring-2 focus:ring-blue-500 ${justify} hover:text-blue-600 dark:hover:text-blue-400`

  if (!onSortChange) {
    return (
      <th scope="col" className={thClassName}>
        {label}
      </th>
    )
  }

  return (
    <th scope="col" aria-sort={ariaSort} className={thClassName}>
      <button
        type="button"
        onClick={handleSort}
        aria-label={`Sort by ${label}`}
        className={triggerClassName}
      >
        <span>{label}</span>
        <SortIndicator active={active} sortDir={sortDir} />
      </button>
    </th>
  )
}
