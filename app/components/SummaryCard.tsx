type SummaryCardProps = {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
};

export default function SummaryCard({ label, value, valueClassName, className }: SummaryCardProps) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${className ?? ""}`}>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}
