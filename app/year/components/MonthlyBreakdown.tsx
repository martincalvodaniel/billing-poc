"use client";

import Link from "next/link";

interface MonthlyTotal {
  monthIndex: number;
  income: number;
  outcome: number;
  net: number;
  totalVolume: number;
}

interface MonthlyBreakdownProps {
  monthlyTotals: MonthlyTotal[];
  selectedYear: number;
  formatCurrency: (amount: number) => string;
  maxMonthlyVolume: number;
}

export default function MonthlyBreakdown({
  monthlyTotals,
  selectedYear,
  formatCurrency,
  maxMonthlyVolume,
}: MonthlyBreakdownProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Monthly breakdown</h4>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Net balance per month</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {monthlyTotals.map((month) => {
          const monthLabel = new Date(selectedYear, month.monthIndex).toLocaleDateString("en-US", {
            month: "short",
          });
          const barWidth = Math.min(100, (month.totalVolume / maxMonthlyVolume) * 100);
          const barColor =
            month.net > 0
              ? "bg-blue-500 dark:bg-blue-400"
              : month.net < 0
                ? "bg-red-500 dark:bg-red-400"
                : "bg-zinc-400 dark:bg-zinc-500";

          return (
            <Link
              key={month.monthIndex}
              href={`/month?month=${month.monthIndex + 1}&year=${selectedYear}`}
              className="block rounded-lg border border-zinc-200 p-3 transition hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-blue-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {monthLabel}
                </span>
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
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(month.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Outcome</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(month.outcome)}
                  </span>
                </div>
              </div>
              <div
                className="mt-3 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800"
                aria-hidden="true"
              >
                <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${barWidth}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
