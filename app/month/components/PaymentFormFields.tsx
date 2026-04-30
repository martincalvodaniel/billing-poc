"use client";

import { PaymentFormData } from "@/lib/types";
import ClientSelector from "@/app/components/ClientSelector";

interface PaymentFormFieldsProps {
  formData: PaymentFormData;
  suggestedTags: string[];
  showTagSuggestions: boolean;
  showAdditionalFields: boolean;
  onSetShowAdditionalFields: (show: boolean) => void;
  onChangeField: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    conceptIndex?: number
  ) => void;
  onTagSelect: (tag: string) => void;
  onTagBlur: () => void;
  onClientChange: (clientId: string | undefined) => void;
  onAddConcept: () => void;
  onRemoveConcept: (index: number) => void;
  calculateTotal: () => number;
  calculateVatAmount: () => string;
  calculateSurchargeAmount: () => string;
  calculateNetAmount: () => string;
}

/**
 * Reusable molecule component for payment form fields
 * Shared between PaymentForm and PaymentDetailModal
 */
export default function PaymentFormFields({
  formData,
  suggestedTags,
  showTagSuggestions,
  showAdditionalFields,
  onSetShowAdditionalFields,
  onChangeField,
  onTagSelect,
  onTagBlur,
  onClientChange,
  onAddConcept,
  onRemoveConcept,
  calculateTotal,
  calculateVatAmount,
  calculateSurchargeAmount,
  calculateNetAmount,
}: PaymentFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Payment Type and Date (Shared Row) */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Payment Type */}
        <div className="space-y-2">
          <label
            htmlFor="type"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={onChangeField}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          >
            <option value="income">Income</option>
            <option value="outcome">Outcome</option>
          </select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label
            htmlFor="date"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={onChangeField}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </div>
      </div>

      {/* Tag with Autocomplete and VAT Percentage (Shared Row) */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Tag with Autocomplete */}
        <div className="relative space-y-2">
          <label
            htmlFor="tag"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Tag (Optional)
          </label>
          <input
            type="text"
            id="tag"
            name="tag"
            value={formData.tag || ""}
            onChange={onChangeField}
            onFocus={() => {
              // Note: Component caller must manage showTagSuggestions
              const input = document.getElementById("tag") as HTMLInputElement;
              if (input && formData.tag?.trim() === "") {
                // Caller will handle setting suggestedTags
              }
            }}
            onBlur={onTagBlur}
            placeholder={formData.type === "income" ? "e.g., Inc1, Inc2, etc." : "e.g., Out1, Out2, etc."}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />

          {/* Tag Suggestions Dropdown */}
          {showTagSuggestions && suggestedTags.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              <ul className="max-h-48 overflow-y-auto py-1">
                {suggestedTags.map((tag) => (
                  <li key={tag}>
                    <button
                      type="button"
                      onClick={() => onTagSelect(tag)}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    >
                      {tag}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* VAT Percentage */}
        <div className="space-y-2">
          <label
            htmlFor="vat"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            VAT (%)
          </label>
          <input
            type="number"
            id="vat"
            name="vat"
            value={formData.vat}
            onChange={onChangeField}
            step="0.5"
            min="0"
            max="100"
            placeholder="0"
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </div>
      </div>

      {/* Additional Fields (Collapsed) */}
      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => onSetShowAdditionalFields(!showAdditionalFields)}
          className="flex w-full items-center justify-between rounded-md bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          <span>Additional Fields</span>
          <svg
            className={`h-4 w-4 transition-transform ${showAdditionalFields ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>

        {showAdditionalFields && (
          <div className="space-y-4 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800/50">
            {/* Client Selector */}
            <ClientSelector
              value={formData.clientId}
              onChange={onClientChange}
              label="Client (Optional)"
              required={false}
            />

            {/* Delivery Note Reference */}
            <div className="space-y-2">
              <label
                htmlFor="deliveryNoteRef"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Delivery Note Ref (Optional)
              </label>
              <input
                type="text"
                id="deliveryNoteRef"
                name="deliveryNoteRef"
                value={formData.deliveryNoteRef || ""}
                onChange={onChangeField}
                placeholder="e.g., DN-2024-001"
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Surcharge Percentage (Optional) */}
            <div className="space-y-2">
              <label
                htmlFor="surcharge"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Surcharge (%) - Optional
              </label>
              <input
                type="number"
                id="surcharge"
                name="surcharge"
                value={formData.surcharge}
                onChange={onChangeField}
                step="0.1"
                min="0"
                max="100"
                placeholder="0"
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Concepts (Payment Components) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Payment Components
          </label>
          <button
            type="button"
            onClick={onAddConcept}
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            +
          </button>
        </div>

        {formData.concepts.map((concept, index) => (
          <div
            key={index}
            className="relative grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50 sm:grid-cols-12"
          >
            <div className="space-y-2 col-span-12 sm:col-span-7">
              <label
                htmlFor={`conceptName-${index}`}
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Name
              </label>
              <input
                type="text"
                id={`conceptName-${index}`}
                name="conceptName"
                value={concept.name || ""}
                onChange={(e) => onChangeField(e, index)}
                placeholder="e.g., Service, Product..."
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
            <div className="space-y-2 col-span-6 sm:col-span-3">
              <label
                htmlFor={`conceptAmount-${index}`}
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Amount (€)
              </label>
              <input
                type="number"
                id={`conceptAmount-${index}`}
                name="conceptAmount"
                value={concept.amount || ""}
                onChange={(e) => onChangeField(e, index)}
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
            <div className="space-y-2 col-span-6 sm:col-span-2">
              <label
                htmlFor={`conceptQuantity-${index}`}
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Quantity
              </label>
              <input
                type="number"
                id={`conceptQuantity-${index}`}
                name="conceptQuantity"
                value={concept.quantity ?? 1}
                onChange={(e) => onChangeField(e, index)}
                step="1"
                min="1"
                placeholder="1"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            {formData.concepts.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveConcept(index)}
                className="absolute right-2 top-2 flex h-5 w-5 flex-shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                aria-label="Remove component"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* VAT Amount and Net Amount (calculated) */}
      <div className="space-y-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Total from components
          </span>
          <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            €{calculateTotal().toFixed(2)}
          </span>
        </div>
        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700"></div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            VAT Amount
          </span>
          <span className="text-lg font-semibold text-red-600 dark:text-red-400">
            €{calculateVatAmount()}
          </span>
        </div>
        {parseFloat(formData.surcharge || "0") > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Surcharge Amount
            </span>
            <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              €{calculateSurchargeAmount()}
            </span>
          </div>
        )}
        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Net Amount (after deductions)
            </span>
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
              €{calculateNetAmount()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
