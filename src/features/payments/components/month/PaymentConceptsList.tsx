"use client"
import { useId } from "react"
import NumberStepperInput from "@/components/ui/NumberStepperInput"
import { useStableCallback } from "@/hooks/useStableCallback"
import type {
  PaymentConcept,
  PaymentFormData,
} from "@/lib/domain/entities/payment"

interface PaymentConceptsListProps {
  formData: PaymentFormData
  onChangeField: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    conceptIndex?: number
  ) => void
  onAddConcept: () => void
  onRemoveConcept: (index: number) => void
}
export default function PaymentConceptsList({
  formData,
  onChangeField,
  onAddConcept,
  onRemoveConcept,
}: PaymentConceptsListProps) {
  const id = useId()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Payment Components
        </span>
        <button
          type="button"
          onClick={onAddConcept}
          className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          +
        </button>
      </div>

      {formData.concepts.map((concept, index) => (
        <PaymentConceptRow
          // biome-ignore lint/suspicious/noArrayIndexKey: concepts have no stable unique ID
          key={index}
          idPrefix={id}
          concept={concept}
          index={index}
          removable={formData.concepts.length > 1}
          onChangeField={onChangeField}
          onRemove={onRemoveConcept}
        />
      ))}
    </div>
  )
}

function PaymentConceptRow({
  idPrefix,
  concept,
  index,
  removable,
  onChangeField,
  onRemove,
}: {
  idPrefix: string
  concept: PaymentConcept
  index: number
  removable: boolean
  onChangeField: PaymentConceptsListProps["onChangeField"]
  onRemove: (index: number) => void
}) {
  const handleChange = useStableCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChangeField(event, index)
  )
  const handleConceptValueChange = (
    name: "conceptAmount" | "conceptQuantity",
    value: string
  ) => {
    onChangeField(
      {
        target: { name, value },
      } as React.ChangeEvent<HTMLInputElement>,
      index
    )
  }
  const handleAmountChange = useStableCallback((value: string) =>
    handleConceptValueChange("conceptAmount", value)
  )
  const handleQuantityChange = useStableCallback((value: string) =>
    handleConceptValueChange("conceptQuantity", value)
  )
  const handleRemove = useStableCallback(() => onRemove(index))

  return (
    <div className="relative grid grid-cols-12 gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <ConceptInput
        id={`${idPrefix}-conceptName-${index}`}
        name="conceptName"
        label="Name"
        value={concept.name || ""}
        onChange={handleChange}
        placeholder="e.g., Service, Product..."
        className="space-y-2 col-span-12 sm:col-span-6"
        required
      />
      <ConceptNumberStepper
        id={`${idPrefix}-conceptAmount-${index}`}
        name="conceptAmount"
        label="Amount (€)"
        value={String(concept.amount || "")}
        onValueChange={handleAmountChange}
        placeholder="0.00"
        step={5}
        inputMode="decimal"
        className="space-y-2 col-span-6 sm:col-span-3"
        required
        ariaLabel="Concept Amount in Euros"
      />
      <ConceptNumberStepper
        id={`${idPrefix}-conceptQuantity-${index}`}
        name="conceptQuantity"
        label="Quantity"
        value={String(concept.quantity ?? 1)}
        onValueChange={handleQuantityChange}
        placeholder="1"
        step={1}
        min={1}
        className="space-y-2 col-span-6 sm:col-span-3"
        ariaLabel="Concept Quantity"
      />
      {removable ? (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute right-2 top-2 flex h-5 w-5 flex-shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          aria-label="Remove component"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      ) : null}
    </div>
  )
}

function ConceptInput({
  label,
  className,
  ...inputProps
}: React.ComponentProps<"input"> & { label: string }) {
  return (
    <div className={className}>
      <label
        htmlFor={inputProps.id}
        className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
      >
        {label}
      </label>
      <input
        {...inputProps}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </div>
  )
}

function ConceptNumberStepper({
  label,
  className,
  ...stepperProps
}: React.ComponentProps<typeof NumberStepperInput> & {
  label: string
  className: string
}) {
  return (
    <div className={className}>
      <label
        htmlFor={stepperProps.id}
        className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
      >
        {label}
      </label>
      <NumberStepperInput {...stepperProps} ariaLabel={label} />
    </div>
  )
}
