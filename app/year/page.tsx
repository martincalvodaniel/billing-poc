"use client";

import { useEffect, useMemo, useState } from "react";
import DonutChart from "../components/DonutChart";
import { Payment } from "@/lib/types";
import NavigationBar from "../components/NavigationBar";
import SummaryCard from "../components/SummaryCard";
import YearSelector from "../components/YearSelector";

export default function YearSummaryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              <YearSelector
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                isViewingCurrentYear={isViewingCurrentYear}
                onGoToCurrentYear={() => {
                  if (!isViewingCurrentYear) {
                    setSelectedYear(currentYear);
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-6 px-6 pb-6">
             <div className="grid gap-4 sm:grid-cols-3">
               <SummaryCard
                 label="Total Income"
                 value={formatCurrency(yearlyIncome)}
                 valueClassName="text-green-600 dark:text-green-400"
                 className="bg-gradient-to-b from-zinc-50 to-white dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-900/60"
               />
               <SummaryCard
                 label="Total Outcome"
                 value={formatCurrency(yearlyOutcome)}
                 valueClassName="text-red-600 dark:text-red-400"
                 className="bg-gradient-to-b from-zinc-50 to-white dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-900/60"
               />
               <SummaryCard
                 label="Net Balance"
                 value={formatCurrency(yearlyNet)}
                 valueClassName={yearlyNet >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}
                 className="bg-gradient-to-b from-zinc-50 to-white dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-900/60"
               />
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
