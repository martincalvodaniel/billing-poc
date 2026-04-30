"use client";

import { useState } from "react";

type PaymentType = "income" | "outcome";

interface PaymentFormData {
  date: string;
  netAmount: string;
  vat: string;
  type: PaymentType;
}

export default function PaymentForm() {
  const [formData, setFormData] = useState<PaymentFormData>({
    date: new Date().toISOString().split("T")[0],
    netAmount: "",
    vat: "",
    type: "income",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Payment submitted:", formData);
    // TODO: Add logic to save payment
    alert("Payment saved! (Check console for details)");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    const net = parseFloat(formData.netAmount) || 0;
    const vatAmount = parseFloat(formData.vat) || 0;
    return (net + vatAmount).toFixed(2);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl space-y-6 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          New Payment
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Add a new income or outcome entry
        </p>
      </div>

      <div className="space-y-4">
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
            onChange={handleChange}
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
            onChange={handleChange}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </div>

        {/* Net Amount */}
        <div className="space-y-2">
          <label
            htmlFor="netAmount"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Net Amount
          </label>
          <input
            type="number"
            id="netAmount"
            name="netAmount"
            value={formData.netAmount}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </div>

        {/* VAT */}
        <div className="space-y-2">
          <label
            htmlFor="vat"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            VAT
          </label>
          <input
            type="number"
            id="vat"
            name="vat"
            value={formData.vat}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </div>

        {/* Total (calculated) */}
        <div className="space-y-2 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Total Amount
            </span>
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              ${calculateTotal()}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Save Payment
      </button>
    </form>
  );
}
