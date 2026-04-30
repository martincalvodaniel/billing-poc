"use client";

import { useEffect, useMemo, useState } from "react";
import DonutChart from "../components/DonutChart";
import { Payment } from "@/lib/types";
import NavigationBar from "../components/NavigationBar";

export default function YearSummaryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearInput, setYearInput] = useState(() => new Date().getFullYear().toString());

  useEffect(() => {
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
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        console.error(`Error fetching payments: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const groupPaymentsByTag = (list: Payment[], paymentType: Payment["type"]) => {
    return list
      .filter((payment) => payment.type === paymentType)
      .reduce((acc, payment) => {
        const tag = payment.tag || "Untagged";
        acc[tag] = (acc[tag] || 0) + payment.total;
        return acc;
      }, {} as Record<string, number>);
  };

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const isViewingCurrentYear = selectedYear === currentYear;

  useEffect(() => {
    setYearInput(selectedYear.toString());
  }, [selectedYear]);

  const paymentsForYear = useMemo(
    () =>
      payments.filter((payment) => {
        const paymentDate = new Date(payment.date);
        return paymentDate.getFullYear() === selectedYear;
      }),
    [payments, selectedYear]
  );

  const monthlyTotals = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, monthIndex) => ({
      monthIndex,
      income: 0,
      outcome: 0,
    }));

    paymentsForYear.forEach((payment) => {
      const paymentMonth = new Date(payment.date).getMonth();
      const bucket = buckets[paymentMonth];
      if (payment.type === "income") {
        bucket.income += payment.total;
      } else {
        bucket.outcome += payment.total;
      }
    });

    return buckets.map((bucket) => ({
      ...bucket,
      net: bucket.income - bucket.outcome,
      totalVolume: bucket.income + bucket.outcome,
    }));
  }, [paymentsForYear]);

  const yearlyIncome = monthlyTotals.reduce((sum, month) => sum + month.income, 0);
  const yearlyOutcome = monthlyTotals.reduce((sum, month) => sum + month.outcome, 0);
  const yearlyNet = yearlyIncome - yearlyOutcome;
  const maxMonthlyVolume = Math.max(1, ...monthlyTotals.map((month) => month.totalVolume));

  const incomeByTagYear = groupPaymentsByTag(paymentsForYear, "income");
  const outcomeByTagYear = groupPaymentsByTag(paymentsForYear, "outcome");

  const handleYearChange = (direction: "prev" | "next") => {
    setSelectedYear((year) => (direction === "prev" ? year - 1 : year + 1));
    setShowYearPicker(false);
  };

  const handleGoToCurrentYear = () => {
    if (isViewingCurrentYear) return;
    setSelectedYear(currentYear);
    setShowYearPicker(false);
  };

  const handleYearSelect = (year: number) => {
    if (Number.isNaN(year)) return;
    setSelectedYear(year);
    setShowYearPicker(false);
  };

  const handleYearInputSubmit = () => {
    const parsed = parseInt(yearInput, 10);
    if (Number.isNaN(parsed)) return;
    handleYearSelect(parsed);
  };

  const candidateYears = useMemo(() => {
    const base = selectedYear;
    return Array.from({ length: 12 }, (_, idx) => base - 6 + idx);
  }, [selectedYear]);

  const colors = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
  ];

  return (
    <div className="min-h-screen bg-zinc-50 p-4 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl space-y-8 py-12">
        <NavigationBar subtitle="Yearly Summary" />

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Yearly Overview
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Explore income and outcome performance across the year
          </p>
        </div>

        <div className="space-y-6 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Yearly Filter</p>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Overview for {selectedYear}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleYearChange("prev")}
                aria-label="View previous year"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
              >
                ← Prev
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowYearPicker((open) => !open)}
                  aria-haspopup="dialog"
                  aria-expanded={showYearPicker}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
                >
                  {selectedYear}
                </button>

                {showYearPicker && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    className="absolute right-0 top-full z-40 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <div className="flex items-center gap-2">
                      <label htmlFor="year-input" className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Year
                      </label>
                      <input
                        id="year-input"
                        type="number"
                        inputMode="numeric"
                        value={yearInput}
                        onChange={(e) => setYearInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleYearInputSubmit();
                          }
                        }}
                        className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        aria-label="Enter year manually"
                      />
                      <button
                        type="button"
                        onClick={handleYearInputSubmit}
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-offset-zinc-900"
                      >
                        Go
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {candidateYears.map((year) => {
                        const isActive = year === selectedYear;
                        return (
                          <button
                            key={year}
                            type="button"
                            onClick={() => handleYearSelect(year)}
                            className={`rounded-md px-2 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                              isActive
                                ? "bg-blue-600 text-white shadow-sm dark:bg-blue-700"
                                : "border border-zinc-200 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleYearChange("next")}
                aria-label="View next year"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
              >
                Next →
              </button>
              <button
                onClick={handleGoToCurrentYear}
                disabled={isViewingCurrentYear}
                aria-label="Jump to current year"
                className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400 disabled:hover:bg-transparent dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30 dark:focus:ring-offset-zinc-900 dark:disabled:border-zinc-700 dark:disabled:text-zinc-500"
              >
                🎯
              </button>
            </div>
          </div>

          <div className="space-y-6 px-6 pb-6">
             <div className="grid gap-4 sm:grid-cols-3">
               <div className="rounded-lg border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-4 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-900/60">
                 <p className="text-sm text-zinc-600 dark:text-zinc-400">Income (YTD)</p>
                 <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(yearlyIncome)}</p>
               </div>
               <div className="rounded-lg border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-4 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-900/60">
                 <p className="text-sm text-zinc-600 dark:text-zinc-400">Outcome (YTD)</p>
                 <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(yearlyOutcome)}</p>
               </div>
               <div className="rounded-lg border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-4 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-900/60">
                 <p className="text-sm text-zinc-600 dark:text-zinc-400">Net (YTD)</p>
                 <p className={`mt-2 text-2xl font-bold ${yearlyNet >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                   {formatCurrency(yearlyNet)}
                 </p>
               </div>
             </div>

             {paymentsForYear.length === 0 ? (
               <div className="rounded-md bg-zinc-50 p-6 text-center text-sm text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                 No payments recorded in {selectedYear}.
               </div>
             ) : (
               <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DonutChart data={incomeByTagYear} title={`Income by Tag (${selectedYear})`} colors={colors} />
                  <DonutChart data={outcomeByTagYear} title={`Outcome by Tag (${selectedYear})`} colors={colors} />
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Monthly breakdown</h4>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Net balance per month</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {monthlyTotals.map((month) => {
                      const monthLabel = new Date(selectedYear, month.monthIndex).toLocaleDateString("en-US", { month: "short" });
                      const barWidth = Math.min(100, (month.totalVolume / maxMonthlyVolume) * 100);
                      const barColor = month.net > 0
                        ? "bg-blue-500 dark:bg-blue-400"
                        : month.net < 0
                          ? "bg-red-500 dark:bg-red-400"
                          : "bg-zinc-400 dark:bg-zinc-500";

                      return (
                        <div
                          key={month.monthIndex}
                          className="rounded-lg border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-3 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{monthLabel}</span>
                            <span
                              className={`text-xs font-semibold ${
                                month.net > 0
                                  ? "text-blue-600 dark:text-blue-300"
                                  : month.net < 0
                                    ? "text-red-600 dark:text-red-300"
                                    : "text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              {formatCurrency(month.net)}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                            <div className="flex items-center justify-between">
                              <span>Income</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(month.income)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Outcome</span>
                              <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(month.outcome)}</span>
                            </div>
                          </div>
                          <div className="mt-3 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" aria-hidden="true">
                            <div
                              className={`h-2 rounded-full ${barColor}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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

        {isLoading && (
          <div className="space-y-4">
            <div className="h-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        )}
       </main>
    </div>
  );
}
