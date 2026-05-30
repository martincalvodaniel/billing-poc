import { formatCurrency } from "@/lib/formatters"
import SummaryCard from "../../components/SummaryCard"

export default function PaymentsSummary({
  totalIncome,
  totalOutcome,
  netBalance,
  incomeCount,
  outcomeCount,
  typeFilter,
  onTypeFilterToggle,
}: {
  totalIncome: number
  totalOutcome: number
  netBalance: number
  incomeCount: number
  outcomeCount: number
  typeFilter: "all" | "income" | "outcome"
  onTypeFilterToggle: (type: "income" | "outcome") => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <SummaryCard
        label={`Total Income (${incomeCount})`}
        value={formatCurrency(totalIncome)}
        valueClassName="text-green-600 dark:text-green-400"
        active={typeFilter === "income"}
        onClick={() => onTypeFilterToggle("income")}
        ariaLabel="Filter table by income payments"
      />
      <SummaryCard
        label={`Total Outcome (${outcomeCount})`}
        value={formatCurrency(totalOutcome)}
        valueClassName="text-red-600 dark:text-red-400"
        active={typeFilter === "outcome"}
        onClick={() => onTypeFilterToggle("outcome")}
        ariaLabel="Filter table by outcome payments"
      />
      <SummaryCard
        label="Net Balance"
        value={formatCurrency(netBalance)}
        valueClassName={
          netBalance >= 0
            ? "text-blue-600 dark:text-blue-400"
            : "text-red-600 dark:text-red-400"
        }
      />
    </div>
  )
}
