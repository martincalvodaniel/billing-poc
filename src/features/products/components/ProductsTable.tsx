"use client"

import { EmptyState } from "@/components/ui/EmptyState"
import type { Product } from "@/lib/domain/entities/product"
import ProductTableRow from "./ProductTableRow"

interface ProductsTableProps {
  products: Product[]
  selectedProductIds: string[]
  onToggleSelected: (productId: string) => void
  onEdit: (productId: string) => void
  onDelete: (productId: string) => void
}

export default function ProductsTable({
  products,
  selectedProductIds,
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
            <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Name
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Final price
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Stock
            </th>
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
