"use client"

import { useId, useState } from "react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import type { Client, ClientFormData } from "@/lib/domain/entities/client"

interface ClientFormProps {
  client?: Client
  onSubmit: (data: ClientFormData) => Promise<void>
  onCancel: () => void
}

export default function ClientForm({
  client,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const id = useId()
  const [formData, setFormData] = useState<ClientFormData>({
    clientType: client?.clientType || "individual",
    name: client?.name || "",
    taxId: client?.taxId || "",
    address: client?.address || "",
    phone: client?.phone || "",
    email: client?.email || "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)

    // Validate form data
    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <ErrorBanner bordered>{error}</ErrorBanner> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${id}-clientType`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Type
          </label>
          <select
            id={`${id}-clientType`}
            name="clientType"
            value={formData.clientType}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:ring-offset-zinc-900"
            disabled={isSubmitting}
          >
            <option value="individual">Individual / Freelancer</option>
            <option value="company">Company</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor={`${id}-client-name`}
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {formData.clientType === "individual"
            ? "Name & Surname"
            : "Business Name"}
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        </label>
        <input
          type="text"
          id={`${id}-client-name`}
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={
            formData.clientType === "individual"
              ? "E.g., John Doe"
              : "E.g., Empresa, S.L."
          }
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-offset-zinc-900"
          required
          aria-required="true"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          htmlFor={`${id}-client-taxId`}
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Tax ID (NIF/CIF/NIE)
        </label>
        <input
          type="text"
          id={`${id}-client-taxId`}
          name="taxId"
          value={formData.taxId || ""}
          onChange={handleChange}
          placeholder={
            formData.clientType === "individual"
              ? "E.g., 12345678A"
              : "E.g., A12345678"
          }
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-offset-zinc-900"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          htmlFor={`${id}-client-address`}
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Tax Address
        </label>
        <textarea
          id={`${id}-client-address`}
          name="address"
          value={formData.address || ""}
          onChange={handleChange}
          placeholder="E.g., Calle Principal 123, 28001 Madrid"
          rows={3}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-offset-zinc-900"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${id}-client-phone`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id={`${id}-client-phone`}
            name="phone"
            value={formData.phone || ""}
            onChange={handleChange}
            placeholder="E.g., +34 123 456 789"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-offset-zinc-900"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor={`${id}-client-email`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Email Address
          </label>
          <input
            type="email"
            id={`${id}-client-email`}
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
            placeholder="E.g., client@example.com"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-offset-zinc-900"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-zinc-900"
        >
          {isSubmitting ? "Saving..." : client ? "Update" : "Create"} Client
        </button>
      </div>
    </form>
  )
}
