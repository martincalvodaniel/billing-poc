"use client"

import { EmptyState } from "@/components/ui/EmptyState"
import { SortableTableHeader } from "@/components/ui/SortableTableHeader"
import type { Product } from "@/lib/domain/entities/product"
import ProductTableRow from "./ProductTableRow"
import type { ProductSortKey, ProductSortState } from "./product-sort-utils"

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
            <SortableTableHeader
              label="Name"
              sortKey="name"
              sort={sortState}
              onSortChange={onSortChange}
              align="left"
            />
            <SortableTableHeader
              label="Final price"
              sortKey="finalPrice"
              sort={sortState}
              onSortChange={onSortChange}
              align="right"
            />
            <SortableTableHeader
              label="Stock"
              sortKey="stock"
              sort={sortState}
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
