"use client";

import { useEffect, useMemo, useState } from "react";
import DonutChart from "../components/DonutChart";
import MonthlyBreakdown from "./components/MonthlyBreakdown";
import { Payment } from "@/lib/types";
import PageLayout from "../components/PageLayout";
import SummaryCard from "../components/SummaryCard";
import YearSelector from "./components/YearSelector";

export default function YearSummaryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/payments?year=${selectedYear}`, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch payments");
        }
        const data = await response.json();
        if (!abortController.signal.aborted) {
          setPayments(data.payments || []);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, ignore
          return;
        }
        const message = err instanceof Error ? err.message : "An error occurred";
        if (!abortController.signal.aborted) {
          setError(message);
        }
        console.error(`Error fetching payments: ${err}`);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchPayments();

    return () => {
      abortController.abort();
    };
  }, [selectedYear]);

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
    () => payments, // API already filters by year
    [payments]
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
    <PageLayout
      title="Yearly Overview"
      subtitle="Explore income and outcome performance across the year"
      navigationSubtitle="Yearly Overview"
      headerContent={
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label={`Total Income (${paymentsForYear.filter((p) => p.type === "income").length})`}
            value={formatCurrency(yearlyIncome)}
            valueClassName="text-green-600 dark:text-green-400"
          />
          <SummaryCard
            label={`Total Outcome (${paymentsForYear.filter((p) => p.type === "outcome").length})`}
            value={formatCurrency(yearlyOutcome)}
            valueClassName="text-red-600 dark:text-red-400"
          />
          <SummaryCard
            label="Net Balance"
            value={formatCurrency(yearlyNet)}
            valueClassName={yearlyNet >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}
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

            <MonthlyBreakdown
              monthlyTotals={monthlyTotals}
              selectedYear={selectedYear}
              formatCurrency={formatCurrency}
              maxMonthlyVolume={maxMonthlyVolume}
            />
          </div>
        )}
        
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
      </div>
    </PageLayout>
  );
}
