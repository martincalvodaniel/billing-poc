"use client"

import { useCallback } from "react"
import { IconButton } from "@/components/ui/IconButton"
import { PencilIcon } from "@/components/ui/icons/PencilIcon"
import { TrashIcon } from "@/components/ui/icons/TrashIcon"
import type { Product } from "@/lib/domain/entities/product"
import { formatCurrency } from "@/lib/utils/formatters"

interface ProductTableRowProps {
  product: Product
  index: number
  selected: boolean
  onToggleSelected: (productId: string) => void
  onEdit: (productId: string) => void
  onDelete: (productId: string) => void
}

export default function ProductTableRow({
  product,
  index,
  selected,
  onToggleSelected,
  onEdit,
  onDelete,
}: ProductTableRowProps) {
  const productId = product._id ?? ""
  const stripe =
    index % 2 === 0
      ? "bg-white dark:bg-zinc-900"
      : "bg-zinc-50 dark:bg-zinc-800/50"
  const selectedRowClass = selected
    ? "bg-blue-200/90 shadow-[inset_0_0_0_2px_rgba(37,99,235,0.85)] dark:bg-blue-900/45 dark:shadow-[inset_0_0_0_2px_rgba(96,165,250,0.85)]"
    : ""

  const handleRowClick = useCallback(
    () => onToggleSelected(productId),
    [onToggleSelected, productId]
  )
  const handleEditClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onEdit(productId)
    },
    [onEdit, productId]
  )
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onDelete(productId)
    },
    [onDelete, productId]
  )

  return (
    <tr
      onClick={handleRowClick}
      aria-selected={selected}
      className={`cursor-pointer border-b border-zinc-200 transition-colors hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-blue-900/20 ${stripe} ${selectedRowClass}`}
    >
      <td
        className={`px-4 py-4 text-sm text-zinc-900 dark:text-zinc-50 ${
          selected ? "font-semibold" : "font-medium"
        }`}
      >
        {product.name}
      </td>
      <td
        className={`px-4 py-4 text-sm ${
          selected
            ? "font-medium text-zinc-900 dark:text-zinc-100"
            : "text-zinc-700 dark:text-zinc-300"
        }`}
      >
        {formatCurrency(product.finalPrice)}
      </td>
      <td
        className={`px-4 py-4 text-sm ${
          selected
            ? "font-medium text-zinc-900 dark:text-zinc-100"
            : "text-zinc-700 dark:text-zinc-300"
        }`}
      >
        {product.stock != null ? product.stock : "-"}
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center justify-end gap-2">
          <IconButton
            onClick={handleEditClick}
            ariaLabel={`Edit product ${product.name}`}
            variant="neutral"
            size="sm"
            stopPropagation
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            onClick={handleDeleteClick}
            ariaLabel={`Delete product ${product.name}`}
            variant="danger"
            size="sm"
            stopPropagation
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </td>
    </tr>
  )
}
