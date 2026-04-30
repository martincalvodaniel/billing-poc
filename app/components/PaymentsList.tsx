"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Payment } from "@/lib/types";

export default forwardRef(function PaymentsList(props, ref) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  useImperativeHandle(ref, () => ({
    refreshPayments: fetchPayments,
  }));

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/payments");

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error fetching payments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalIncome = payments
    .filter((p) => p.type === "income")
    .reduce((sum, p) => sum + p.total, 0);

  const totalOutcome = payments
    .filter((p) => p.type === "outcome")
    .reduce((sum, p) => sum + p.total, 0);

  const netBalance = totalIncome - totalOutcome;

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-800"></div>
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-800"></div>
          <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Income</p>
          <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Outcome</p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalOutcome)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Net Balance</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              netBalance >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="w-full rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Payments ({payments.length})
          </h2>
        </div>

        {error && (
          <div className="m-6 rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {payments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No payments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    Net Amount
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    VAT
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment._id?.toString()}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">
                      {formatDate(payment.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          payment.type === "income"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {payment.type.charAt(0).toUpperCase() +
                          payment.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.netAmount)}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.vat)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});
