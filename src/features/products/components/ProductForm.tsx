"use client"

import { useCallback, useId, useState } from "react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import NumberStepperInput from "@/components/ui/NumberStepperInput"
import type { Product, ProductFormData } from "@/lib/domain/entities/product"

interface ProductFormProps {
  product?: Product
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
}

function toFormData(product?: Product): ProductFormData {
  return {
    name: product?.name ?? "",
    finalPrice: product ? String(product.finalPrice) : "",
    stock: product?.stock != null ? String(product.stock) : null,
  }
}

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const id = useId()
  const [formData, setFormData] = useState<ProductFormData>(() =>
    toFormData(product)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback(
    (field: keyof ProductFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setError(null)
    },
    []
  )

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange("name", e.target.value)
    },
    [handleChange]
  )

  const handleFinalPriceChange = useCallback(
    (value: string) => handleChange("finalPrice", value),
    [handleChange]
  )

  const handleStockChange = useCallback(
    (value: string) => handleChange("stock", value),
    [handleChange]
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)

    const name = formData.name.trim()
    const finalPrice = Number.parseFloat(formData.finalPrice)
    const stockInput = (formData.stock ?? "").trim()
    const stock =
      stockInput.length > 0 ? Number.parseFloat(stockInput) : undefined

    if (!name) {
      setError("Name is required")
      return
    }
    if (Number.isNaN(finalPrice) || finalPrice < 0) {
      setError("Final price must be 0 or greater")
      return
    }
    if (
      stock !== undefined &&
      (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock))
    ) {
      setError("Stock must be a whole number greater than or equal to 0")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        finalPrice: formData.finalPrice,
        stock: stockInput.length > 0 ? stockInput : null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <ErrorBanner bordered>{error}</ErrorBanner> : null}

      <div>
        <label
          htmlFor={`${id}-product-name`}
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Name
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        </label>
        <input
          type="text"
          id={`${id}-product-name`}
          name="name"
          value={formData.name}
          onChange={handleNameChange}
          placeholder="E.g., Premium Subscription"
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-offset-zinc-900"
          required
          aria-required="true"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor={`${id}-product-finalPrice`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Final price (€)
          </label>
          <NumberStepperInput
            id={`${id}-product-finalPrice`}
            name="finalPrice"
            value={formData.finalPrice}
            onValueChange={handleFinalPriceChange}
            ariaLabel="Final price"
            step={0.5}
            inputMode="decimal"
            min={0}
            emptyStepBase={0}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`${id}-product-stock`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Current stock
            <span className="ml-1 text-xs font-normal text-zinc-500 dark:text-zinc-400">
              optional
            </span>
          </label>
          <NumberStepperInput
            id={`${id}-product-stock`}
            name="stock"
            value={formData.stock ?? ""}
            onValueChange={handleStockChange}
            ariaLabel="Current stock"
            step={1}
            min={0}
            inputMode="numeric"
            emptyStepBase={0}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-zinc-900"
        >
          {isSubmitting ? "Saving..." : product ? "Update" : "Create"} Product
        </button>
      </div>
    </form>
  )
}
