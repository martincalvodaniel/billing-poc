"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Payment, InvoiceSeries } from "@/lib/types";
import Modal from "@/app/components/Modal";
import ClientSelector from "@/app/components/ClientSelector";

interface PaymentDetailModalProps {
  payment: Payment;
  onClose: () => void;
  onUpdate?: (payment: Payment) => void;
  formatCurrency?: (amount: number) => string;
}

export default function PaymentDetailModal({
  payment,
  onClose,
  onUpdate,
  formatCurrency,
}: PaymentDetailModalProps) {
  const currency = (amount: number) =>
    formatCurrency
      ? formatCurrency(amount)
      : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

  // Form state initialized with payment data
  const [date, setDate] = useState(payment.date);
  const [type, setType] = useState(payment.type);
  const [tag, setTag] = useState(payment.tag || "");
  const [deliveryNoteRef, setDeliveryNoteRef] = useState(payment.deliveryNoteRef || "");
  const [clientId, setClientId] = useState(payment.clientId?.toString() || "");
  const [concepts, setConcepts] = useState(
    payment.concepts && payment.concepts.length > 0
      ? payment.concepts
      : [{ name: "", amount: 0, quantity: 1 }]
  );
  const [vat, setVat] = useState(payment.vat.toString());
  const [surcharge, setSurcharge] = useState(payment.surcharge?.toString() || "");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invoice generation state
  const [selectedSeries, setSelectedSeries] = useState<InvoiceSeries>("Invoice");
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  
  // Provider bill upload state
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tag suggestions state
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch tags when type changes
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(`/api/tags?type=${type}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
        }
      } catch (err) {
        console.error(`Error fetching tags: ${err}`);
      }
    };
    fetchTags();
  }, [type]);

  const handleTagInputChange = (value: string) => {
    setTag(value);
    setShowTagSuggestions(true);

    if (tagDebounceTimer.current) {
      clearTimeout(tagDebounceTimer.current);
    }

    tagDebounceTimer.current = setTimeout(() => {
      if (value.trim() === "") {
        setSuggestedTags(availableTags);
      } else {
        const filtered = availableTags.filter((t) =>
          t.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestedTags(filtered);
      }
    }, 300);
  };

  const handleTagSelect = (selectedTag: string) => {
    setTag(selectedTag);
    setShowTagSuggestions(false);
    setSuggestedTags([]);
  };

  const handleClientChange = (newClientId: string | undefined) => {
    setClientId(newClientId || "");
  };

  const handleConceptChange = (
    index: number,
    field: "name" | "amount" | "quantity",
    value: string | number
  ) => {
    setConcepts((prev) => {
      const updated = [...prev];
      if (field === "name") {
        updated[index].name = value as string;
      } else if (field === "amount") {
        updated[index].amount = typeof value === "number" ? value : parseFloat(value) || 0;
      } else if (field === "quantity") {
        updated[index].quantity = typeof value === "number" ? value : parseFloat(value) || 1;
      }
      return updated;
    });
  };

  const addConcept = () => {
    setConcepts((prev) => [...prev, { name: "", amount: 0, quantity: 1 }]);
  };

  const removeConcept = (index: number) => {
    if (concepts.length > 1) {
      setConcepts((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return concepts.reduce((sum, c) => sum + c.amount * (c.quantity || 1), 0);
  };

  const calculateVatAmount = () => {
    const total = calculateTotal();
    const vatPercentage = parseFloat(vat) || 0;
    const surchargePercentage = parseFloat(surcharge || "0") || 0;
    return total * (vatPercentage / 100) / (1 + vatPercentage / 100 + surchargePercentage / 100);
  };

  const calculateSurchargeAmount = () => {
    const total = calculateTotal();
    const vatPercentage = parseFloat(vat) || 0;
    const surchargePercentage = parseFloat(surcharge || "0") || 0;
    if (surchargePercentage === 0) return 0;
    return total * (surchargePercentage / 100) / (1 + vatPercentage / 100 + surchargePercentage / 100);
  };

  const calculateNetAmount = () => {
    const total = calculateTotal();
    const vatPercentage = parseFloat(vat) || 0;
    const surchargePercentage = parseFloat(surcharge || "0") || 0;
    return total / (1 + vatPercentage / 100 + surchargePercentage / 100);
  };

  const handleGenerateInvoice = async () => {
    setInvoiceError(null);
    setIsGeneratingInvoice(true);

    try {
      const response = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment._id?.toString(),
          series: selectedSeries,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate invoice");
      }

      const data = await response.json();
      
      // Update the local payment with invoice metadata
      const updatedPayment: Payment = {
        ...payment,
        invoice: data.invoice,
        updatedAt: new Date(),
      };
      
      onUpdate?.(updatedPayment);
      
      // Open the invoice in a new tab
      window.open(data.downloadUrl, "_blank");
    } catch (err) {
      console.error(`Error generating invoice: ${err}`);
      setInvoiceError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleUploadProviderBill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File size exceeds 10MB limit");
      return;
    }

    setUploadError(null);
    setIsUploadingBill(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("paymentId", payment._id?.toString() || "");

      const response = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload provider bill");
      }

      const data = await response.json();
      
      // Update the local payment with provider bill URL
      const updatedPayment: Payment = {
        ...payment,
        providerBillUrl: data.billUrl,
        providerBillPathname: data.pathname,
        updatedAt: new Date(),
      };
      
      onUpdate?.(updatedPayment);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(`Error uploading provider bill: ${err}`);
      setUploadError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUploadingBill(false);
    }
  };

  const handleSave = async () => {
    setError(null);

    // Validation
    if (!date) {
      setError("Date is required");
      return;
    }

    const validConcepts = concepts.filter((c) => c.amount > 0);
    if (validConcepts.length === 0) {
      setError("At least one concept must have an amount greater than 0");
      return;
    }

    if (concepts.some((c) => !c.name || c.name.trim() === "")) {
      setError("All concepts must have a name");
      return;
    }

    const vatNumber = parseFloat(vat);
    if (isNaN(vatNumber) || vatNumber < 0 || vatNumber > 100) {
      setError("VAT must be between 0 and 100");
      return;
    }

    const surchargeNumber = surcharge ? parseFloat(surcharge) : 0;
    if (surcharge && (isNaN(surchargeNumber) || surchargeNumber < 0 || surchargeNumber > 100)) {
      setError("Surcharge must be between 0 and 100");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payment._id?.toString(),
          date,
          type,
          tag: tag || undefined,
          clientId: clientId || undefined,
          concepts,
          vat: vatNumber,
          surcharge: surchargeNumber > 0 ? surchargeNumber : undefined,
          deliveryNoteRef: deliveryNoteRef || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update payment");
      }

      const responseData = await response.json();
      
      // Reconstruct the updated payment with response data
      const updatedPayment: Payment = {
        ...payment,
        date,
        type,
        tag: tag || undefined,
        concepts,
        vat: responseData.vat ?? vatNumber,
        surcharge: responseData.surcharge ?? (surchargeNumber > 0 ? surchargeNumber : undefined),
        deliveryNoteRef: deliveryNoteRef || undefined,
        total: responseData.total ?? calculateTotal(),
        vatAmount: responseData.vatAmount ?? calculateVatAmount(),
        surchargeAmount: responseData.surchargeAmount ?? (surchargeNumber > 0 ? calculateSurchargeAmount() : undefined),
        netAmount: responseData.netAmount ?? calculateNetAmount(),
        updatedAt: new Date(),
      };
      
      onUpdate?.(updatedPayment);
      onClose();
    } catch (err) {
      console.error(`Error updating payment: ${err}`);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Payment"
      maxWidth="lg"
      closeOnEscape={true}
      closeOnBackdropClick={true}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
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

        {/* Payment Type */}
        <div className="space-y-2">
          <label
            htmlFor="edit-type"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Type
          </label>
          <select
            id="edit-type"
            value={type}
            onChange={(e) => setType(e.target.value as "income" | "outcome")}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          >
            <option value="income">Income</option>
            <option value="outcome">Outcome</option>
          </select>
        </div>

        {/* Client Selector */}
        <ClientSelector
          value={clientId}
          onChange={handleClientChange}
          label="Client (Optional)"
          required={false}
        />

        {/* Date */}
        <div className="space-y-2">
          <label
            htmlFor="edit-date"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Date
          </label>
          <input
            type="date"
            id="edit-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </div>

        {/* Tag with Autocomplete */}
        <div className="relative space-y-2">
          <label
            htmlFor="edit-tag"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Tag (Optional)
          </label>
          <input
            type="text"
            id="edit-tag"
            value={tag}
            onChange={(e) => handleTagInputChange(e.target.value)}
            onFocus={() => {
              setShowTagSuggestions(true);
              if (tag.trim() === "") {
                setSuggestedTags(availableTags);
              }
            }}
            onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
            placeholder={type === "income" ? "e.g., Inc1, Inc2, etc." : "e.g., Out1, Out2, etc."}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />

          {/* Tag Suggestions Dropdown */}
          {showTagSuggestions && suggestedTags.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              <ul className="max-h-48 overflow-y-auto py-1">
                {suggestedTags.map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => handleTagSelect(t)}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    >
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Delivery Note Reference */}
        <div className="space-y-2">
          <label
            htmlFor="edit-deliveryNoteRef"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Delivery Note Ref (Optional)
          </label>
          <input
            type="text"
            id="edit-deliveryNoteRef"
            value={deliveryNoteRef}
            onChange={(e) => setDeliveryNoteRef(e.target.value)}
            placeholder="e.g., DN-2024-001"
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* Concepts (Payment Components) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Payment Components
            </label>
            <button
              type="button"
              onClick={addConcept}
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              + Add Component
            </button>
          </div>

          {concepts.map((concept, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50 sm:grid-cols-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor={`edit-conceptName-${index}`}
                  className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Name
                </label>
                <input
                  type="text"
                  id={`edit-conceptName-${index}`}
                  value={concept.name || ""}
                  onChange={(e) => handleConceptChange(index, "name", e.target.value)}
                  placeholder="e.g., Service, Product..."
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor={`edit-conceptAmount-${index}`}
                  className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Amount (€)
                </label>
                <input
                  type="number"
                  id={`edit-conceptAmount-${index}`}
                  value={concept.amount || ""}
                  onChange={(e) => handleConceptChange(index, "amount", e.target.value)}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor={`edit-conceptQuantity-${index}`}
                  className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Quantity
                </label>
                <input
                  type="number"
                  id={`edit-conceptQuantity-${index}`}
                  value={concept.quantity ?? 1}
                  onChange={(e) => handleConceptChange(index, "quantity", e.target.value)}
                  step="1"
                  min="1"
                  placeholder="1"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              {concepts.length > 1 && (
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => removeConcept(index)}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
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
                </div>
              )}
            </div>
          ))}

          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <p className="font-medium">Total from components: {currency(calculateTotal())}</p>
          </div>
        </div>

        {/* VAT Percentage */}
        <div className="space-y-2">
          <label
            htmlFor="edit-vat"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            VAT (%)
          </label>
          <input
            type="number"
            id="edit-vat"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            step="0.5"
            min="0"
            max="100"
            placeholder="0"
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </div>

        {/* Surcharge Percentage (Optional) */}
        <div className="space-y-2">
          <label
            htmlFor="edit-surcharge"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Surcharge (%) - Optional
          </label>
          <input
            type="number"
            id="edit-surcharge"
            value={surcharge}
            onChange={(e) => setSurcharge(e.target.value)}
            step="0.1"
            min="0"
            max="100"
            placeholder="0"
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* VAT Amount and Net Amount (calculated) */}
        <div className="space-y-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              VAT Amount
            </span>
            <span className="text-lg font-semibold text-red-600 dark:text-red-400">
              {currency(calculateVatAmount())}
            </span>
          </div>
          {parseFloat(surcharge || "0") > 0 && (
            <div className="flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Surcharge Amount
              </span>
              <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {currency(calculateSurchargeAmount())}
              </span>
            </div>
          )}
          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Net Amount (after deductions)
              </span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                {currency(calculateNetAmount())}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice/Provider Bill Section */}
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {type === "income" ? "Invoice" : "Provider Bill"}
          </h3>

          {/* Income: Invoice Generation */}
          {type === "income" && (
            <div className="space-y-3">
              {payment.invoice ? (
                <div className="space-y-2">
                  <div className="text-sm text-zinc-700 dark:text-zinc-300">
                    <p>
                      <span className="font-medium">Series:</span> {payment.invoice.series}
                    </p>
                    <p>
                      <span className="font-medium">Number:</span> {String(payment.invoice.number).padStart(6, "0")}
                    </p>
                    <p>
                      <span className="font-medium">Generated:</span>{" "}
                      {new Date(payment.invoice.generatedAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <a
                    href={payment.invoice.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Invoice
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoiceError && (
                    <div
                      className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      role="alert"
                    >
                      {invoiceError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label
                      htmlFor="invoice-series"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Invoice Series
                    </label>
                    <select
                      id="invoice-series"
                      value={selectedSeries}
                      onChange={(e) => setSelectedSeries(e.target.value as InvoiceSeries)}
                      disabled={isGeneratingInvoice}
                      className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="Invoice">Invoice</option>
                      <option value="RectificativeInvoice">Rectificative Invoice</option>
                      <option value="SimpleInvoice">Simple Invoice</option>
                      <option value="RectificativeSimpleInvoice">Rectificative Simple Invoice</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateInvoice}
                    disabled={isGeneratingInvoice}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    {isGeneratingInvoice ? "Generating..." : "Generate Invoice"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Outcome: Provider Bill Upload */}
          {type === "outcome" && (
            <div className="space-y-3">
              {payment.providerBillUrl ? (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    Provider bill uploaded
                  </p>
                  <a
                    href={payment.providerBillUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Provider Bill
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadError && (
                    <div
                      className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      role="alert"
                    >
                      {uploadError}
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleUploadProviderBill}
                      disabled={isUploadingBill}
                      className="hidden"
                      id="provider-bill-upload"
                    />
                    <label
                      htmlFor="provider-bill-upload"
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
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
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      {isUploadingBill ? "Uploading..." : "Upload Provider Bill (PDF)"}
                    </label>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Max file size: 10MB. Only PDF files allowed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
