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
    taxes: product ? String(product.taxes) : "21",
    stock: product ? String(product.stock) : "0",
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

  const handleTaxesChange = useCallback(
    (value: string) => handleChange("taxes", value),
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
    const taxes = Number.parseFloat(formData.taxes)
    const stock = Number.parseFloat(formData.stock)

    if (!name) {
      setError("Name is required")
      return
    }
    if (Number.isNaN(finalPrice) || finalPrice < 0) {
      setError("Final price must be 0 or greater")
      return
    }
    if (Number.isNaN(taxes) || taxes < 0 || taxes > 100) {
      setError("Taxes must be between 0 and 100")
      return
    }
    if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      setError("Stock must be a whole number greater than or equal to 0")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        finalPrice: formData.finalPrice,
        taxes: formData.taxes,
        stock: formData.stock,
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            htmlFor={`${id}-product-taxes`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Taxes (%)
          </label>
          <NumberStepperInput
            id={`${id}-product-taxes`}
            name="taxes"
            value={formData.taxes}
            onValueChange={handleTaxesChange}
            ariaLabel="Taxes percentage"
            step={1}
            min={0}
            max={100}
            inputMode="numeric"
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
          </label>
          <NumberStepperInput
            id={`${id}-product-stock`}
            name="stock"
            value={formData.stock}
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
