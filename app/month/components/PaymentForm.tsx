"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import PaymentFormFields from "./PaymentFormFields";
import { validateConcepts } from "./paymentUtils";
import { usePaymentForm } from "./usePaymentForm";

interface PaymentFormProps {
  onPaymentSaved?: (date: string) => void;
}

const PaymentForm = forwardRef(function PaymentForm({ onPaymentSaved }: PaymentFormProps, ref) {
  const {
    formData,
    suggestedTags,
    showTagSuggestions,
    setSuggestedTags,
    setShowTagSuggestions,
    handleChange,
    handleTagSelect,
    handleTagBlur,
    handleClientChange,
    addConcept,
    removeConcept,
    resetForm,
    setFormDate,
    calculateTotal,
    calculateVatAmount,
    calculateSurchargeAmount,
    calculateNetAmount,
  } = usePaymentForm();

  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  // Provider bill upload state
  const [providerBillFile, setProviderBillFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    setFormDate,
    submit: () => {
      // Programmatically submit the form
      const form = document.querySelector('form[data-payment-form="true"]') as HTMLFormElement;
      form?.requestSubmit();
    },
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadError(null);

    try {
      // Validate concepts
      const validation = validateConcepts(formData.concepts);
      if (!validation.isValid) {
        throw new Error(validation.error || "Validation failed");
      }

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save payment");
      }

      const result = await response.json();
      const paymentId = result.id;

      // Upload provider bill if outcome payment and file is selected
      if (formData.type === "outcome" && providerBillFile) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append("file", providerBillFile);
          uploadFormData.append("paymentId", paymentId);

          const uploadResponse = await fetch("/api/invoices/upload", {
            method: "POST",
            body: uploadFormData,
          });

          if (!uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            throw new Error(uploadData.error || "Failed to upload provider bill");
          }
        } catch (uploadErr) {
          console.error(`Error uploading provider bill: ${uploadErr}`);
          setUploadError(
            uploadErr instanceof Error ? uploadErr.message : "Failed to upload provider bill",
          );
          // Continue with success since payment was created
        }
      }

      // Add new tag to available tags if it's not already there
      // Note: availableTags is managed in usePaymentForm hook
      if (formData.tag) {
        setShowTagSuggestions(false);
        setSuggestedTags([]);
      }

      // Reset concepts, client, and provider bill file while keeping type and date sticky
      resetForm();
      setProviderBillFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Show success toast
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);

      onPaymentSaved?.(formData.date);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error(`Error saving payment: ${err}`);
    }
  };

  const handleFormFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    conceptIndex?: number,
  ) => {
    handleChange(e, conceptIndex);

    // Handle tag suggestions with debounce (managed in hook, but keep dropdown state in sync here)
    if (e.target.name === "tag") {
      setShowTagSuggestions(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProviderBillFile(null);
      return;
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed");
      setProviderBillFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File size exceeds 10MB limit");
      setProviderBillFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploadError(null);
    setProviderBillFile(file);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      // Don't submit if tag dropdown is open (ENTER should select tag)
      if (showTagSuggestions) {
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const submitButton = (e.currentTarget as HTMLFormElement).querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;
        submitButton?.click();
      }
    },
    [showTagSuggestions],
  );

  return (
    <>
      {/* Success Toast Notification */}
      {showSuccess && (
        <div className="fixed left-1/2 top-8 z-50 -translate-x-1/2 animate-[slideDown_0.3s_ease-out]">
          <div
            className="flex items-center gap-3 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 shadow-lg dark:border-green-800 dark:from-green-950/90 dark:to-emerald-950/90"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {/* Success Icon */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            {/* Message */}
            <div className="flex flex-col">
              <p className="font-semibold text-green-900 dark:text-green-100">
                Payment saved successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your payment has been recorded.
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowSuccess(false)}
              className="ml-4 flex-shrink-0 rounded-md p-1 text-green-600 transition-colors hover:bg-green-100 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-green-400 dark:hover:bg-green-900 dark:hover:text-green-200"
              aria-label="Close notification"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        data-payment-form="true"
        className="space-y-4"
      >
        {error && (
          <div
            className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            {error}
          </div>
        )}

        <PaymentFormFields
          formData={formData}
          suggestedTags={suggestedTags}
          showTagSuggestions={showTagSuggestions}
          showAdditionalFields={showAdditionalFields}
          onSetShowAdditionalFields={setShowAdditionalFields}
          onChangeField={handleFormFieldChange}
          onTagSelect={handleTagSelect}
          onTagBlur={handleTagBlur}
          onClientChange={handleClientChange}
          onAddConcept={addConcept}
          onRemoveConcept={removeConcept}
          calculateTotal={calculateTotal}
          calculateVatAmount={calculateVatAmount}
          calculateSurchargeAmount={calculateSurchargeAmount}
          calculateNetAmount={calculateNetAmount}
        />

        {/* Provider Bill Upload (Outcome Only) */}
        {formData.type === "outcome" && (
          <div className="space-y-2">
            <label
              htmlFor="providerBill"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Provider Bill (Optional)
            </label>
            {uploadError && (
              <div
                className="rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-400"
                role="alert"
              >
                {uploadError}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              id="providerBill"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {providerBillFile && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Selected: {providerBillFile.name} ({(providerBillFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Max file size: 10MB. Only PDF files allowed.
            </p>
          </div>
        )}
      </form>
    </>
  );
});

export default PaymentForm;
