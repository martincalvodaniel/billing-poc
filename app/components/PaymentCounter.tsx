import { Payment } from "@/lib/types";

interface PaymentCounterProps {
  payments?: Payment[];
  incomeCount?: number;
  outcomeCount?: number;
}

export default function PaymentCounter({ 
  payments, 
  incomeCount: providedIncomeCount,
  outcomeCount: providedOutcomeCount 
}: PaymentCounterProps) {
  let incomeCount = providedIncomeCount ?? 0;
  let outcomeCount = providedOutcomeCount ?? 0;

  if (payments) {
    incomeCount = payments.filter((p) => p.type === "income").length;
    outcomeCount = payments.filter((p) => p.type === "outcome").length;
  }

  return (
    <span>
      {outcomeCount} Outcome · {incomeCount} Income
    </span>
  );
}
