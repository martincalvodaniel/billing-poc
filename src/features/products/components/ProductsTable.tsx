"use client"

import { EmptyState } from "@/components/ui/EmptyState"
import { useStableCallback } from "@/hooks/useStableCallback"
import type { Product } from "@/lib/domain/entities/product"
import ProductTableRow from "./ProductTableRow"
import type {
  ProductSortDir,
  ProductSortKey,
  ProductSortState,
} from "./product-sort-utils"

interface ProductsTableProps {
  products: Product[]
  selectedProductIds: string[]
  sortState: ProductSortState
  onSortChange: (sortKey: ProductSortKey) => void
  onToggleSelected: (productId: string) => void
  onEdit: (productId: string) => void
  onDelete: (productId: string) => void
}

export default function ProductsTable({
  products,
  selectedProductIds,
  sortState,
  onSortChange,
  onToggleSelected,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <EmptyState variant="card">
        No products yet. Create your first product to start building your
        inventory.
      </EmptyState>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
            <SortableHeader
              label="Name"
              sortKey="name"
              sortState={sortState}
              onSortChange={onSortChange}
              align="left"
            />
            <SortableHeader
              label="Final price"
              sortKey="finalPrice"
              sortState={sortState}
              onSortChange={onSortChange}
              align="right"
            />
            <SortableHeader
              label="Stock"
              sortKey="stock"
              sortState={sortState}
              onSortChange={onSortChange}
              align="right"
            />
            <th className="w-24 px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <ProductTableRow
              key={product._id}
              product={product}
              index={index}
              selected={selectedProductIds.includes(product._id ?? "")}
              onToggleSelected={onToggleSelected}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

type ColumnAlign = "left" | "right"

function SortIndicator({
  active,
  sortDir,
}: {
  active: boolean
  sortDir: ProductSortDir
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

function SortableHeader({
  label,
  sortKey,
  sortState,
  onSortChange,
  align,
}: {
  label: string
  sortKey: ProductSortKey
  sortState: ProductSortState
  onSortChange: (sortKey: ProductSortKey) => void
  align: ColumnAlign
}) {
  const handleSort = useStableCallback(() => onSortChange(sortKey))
  const active = sortState.sortBy === sortKey
  const ariaSort: "ascending" | "descending" | "none" = active
    ? sortState.sortDir === "asc"
      ? "ascending"
      : "descending"
    : "none"
  const justify = align === "right" ? "justify-end" : "justify-start"
  const alignClass = align === "right" ? "text-right" : "text-left"

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-6 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50 ${alignClass}`}
    >
      <button
        type="button"
        onClick={handleSort}
        aria-label={`Sort by ${label}`}
        className={`inline-flex w-full items-center gap-1 rounded text-inherit focus:outline-none focus:ring-2 focus:ring-blue-500 ${justify} hover:text-blue-600 dark:hover:text-blue-400`}
      >
        <span>{label}</span>
        <SortIndicator active={active} sortDir={sortState.sortDir} />
      </button>
    </th>
  )
}
