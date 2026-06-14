"use client"

import { useCallback, useEffect, useId, useState } from "react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Modal } from "@/components/ui/Modal"
import PaymentFormFields from "@/features/payments/components/month/PaymentFormFields"
import { usePaymentForm } from "@/features/payments/components/month/usePaymentForm"
import type { PaymentFormData } from "@/lib/domain/entities/payment"
import { useCreatePaymentTemplate } from "../hooks/usePaymentTemplateMutations"

interface PaymentTemplateFormModalProps {
  isOpen: boolean
  initialName?: string
  onClose: () => void
  onCreated?: (name: string) => void
}

function extractPaymentTemplateError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message
  }
  if (typeof error === "string" && error.trim() !== "") {
    return error
  }
  return fallback
}

function PaymentTemplateForm({
  formId,
  initialName,
  onSubmit,
}: {
  formId: string
  initialName?: string
  onSubmit: (name: string, formData: PaymentFormData) => Promise<void>
}) {
  const [name, setName] = useState(initialName ?? "")
  const [error, setError] = useState<string | null>(null)
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)
  const {
    formData,
    availableTags,
    handleChange,
    handleTagSelect,
    handleClientChange,
    addConcept,
    removeConcept,
    calculateTotal,
    calculateVatAmount,
    calculateSurchargeAmount,
    calculateNetAmount,
    calculateDiscount,
  } = usePaymentForm(undefined, new Date().toISOString().split("T")[0])
  const id = useId()

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmedName = name.trim()
      if (trimmedName === "") {
        setError("Template name is required")
        return
      }
      try {
        setError(null)
        await onSubmit(trimmedName, formData)
      } catch (error) {
        setError(
          extractPaymentTemplateError(error, "Failed to save payment template")
        )
      }
    },
    [formData, name, onSubmit]
  )

  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setName(event.target.value)
      setError(null)
    },
    []
  )

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      <div className="space-y-2">
        <label
          htmlFor={`${id}-name`}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Template name
        </label>
        <input
          type="text"
          id={`${id}-name`}
          value={name}
          onChange={handleNameChange}
          placeholder="e.g. Monthly consulting"
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          required
        />
      </div>

      <PaymentFormFields
        formData={formData}
        availableTags={availableTags}
        showAdditionalFields={showAdditionalFields}
        showDate={false}
        onSetShowAdditionalFields={setShowAdditionalFields}
        onChangeField={handleChange}
        onTagSelect={handleTagSelect}
        onClientChange={handleClientChange}
        onAddConcept={addConcept}
        onRemoveConcept={removeConcept}
        calculateTotal={calculateTotal}
        calculateVatAmount={calculateVatAmount}
        calculateSurchargeAmount={calculateSurchargeAmount}
        calculateNetAmount={calculateNetAmount}
        calculateDiscount={calculateDiscount}
      />
    </form>
  )
}

export default function PaymentTemplateFormModal({
  isOpen,
  initialName,
  onClose,
  onCreated,
}: PaymentTemplateFormModalProps) {
  const { trigger: createPaymentTemplate, isMutating } =
    useCreatePaymentTemplate()
  const formId = useId()
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    setFormKey((current) => current + 1)
  }, [isOpen])

  const handleSubmit = async (name: string, formData: PaymentFormData) => {
    await createPaymentTemplate({ name, formData })
    onCreated?.(name)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Payment Template"
      maxWidth="xl"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isMutating}
            className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:focus:ring-offset-zinc-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isMutating}
            aria-busy={isMutating}
            className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-offset-zinc-900"
          >
            {String(isMutating ? "Saving..." : "Save Template")}
          </button>
        </div>
      }
    >
      <PaymentTemplateForm
        key={formKey}
        formId={formId}
        initialName={initialName}
        onSubmit={handleSubmit}
      />
    </Modal>
  )
}
