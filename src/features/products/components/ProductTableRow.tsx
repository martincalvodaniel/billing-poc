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

  const handleRowClick = useCallback(
    () => onToggleSelected(productId),
    [onToggleSelected, productId]
  )
  const handleCheckboxChange = useCallback(
    () => onToggleSelected(productId),
    [onToggleSelected, productId]
  )
  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation(),
    []
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
      className={`cursor-pointer border-b border-zinc-200 transition-colors hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-blue-900/20 ${stripe} ${
        selected ? "bg-blue-50/70 dark:bg-blue-900/20" : ""
      }`}
    >
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={selected}
          onClick={handleCheckboxClick}
          onChange={handleCheckboxChange}
          aria-label={`Select product ${product.name}`}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-offset-zinc-900"
        />
      </td>
      <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {product.name}
      </td>
      <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
        {formatCurrency(product.finalPrice)}
      </td>
      <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
        {product.taxes}%
      </td>
      <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
        {product.stock != null ? product.stock : "No stock"}
      </td>
      <td className="px-4 py-4">
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
