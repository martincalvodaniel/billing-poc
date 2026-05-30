type SummaryCardProps = {
  label: string
  value: string
  valueClassName?: string
  className?: string
  onClick?: () => void
  active?: boolean
  ariaLabel?: string
}

export default function SummaryCard({
  label,
  value,
  valueClassName,
  className,
  onClick,
  active = false,
  ariaLabel,
}: SummaryCardProps) {
  const isInteractive = typeof onClick === "function"

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${active ? "ring-1 ring-blue-500" : ""} ${className ?? ""}`}
    >
      <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
        {isInteractive ? (
          <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel ?? label}
            className="text-left hover:text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:hover:text-zinc-100"
          >
            {label}
          </button>
        ) : (
          label
        )}
      </p>
      <p
        className={`mt-2 truncate text-xl font-bold sm:text-2xl ${valueClassName ?? ""}`}
      >
        {value}
      </p>
    </div>
  )
}
