type SummaryCardProps = {
  label: string
  value: string
  valueClassName?: string
  className?: string
  children?: React.ReactNode
  onClick?: () => void
  active?: boolean
  ariaLabel?: string
}

export default function SummaryCard({
  label,
  value,
  valueClassName,
  className,
  children,
  onClick,
  active = false,
  ariaLabel,
}: SummaryCardProps) {
  const isInteractive = typeof onClick === "function"
  const containerClass = `min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${active ? "ring-1 ring-blue-500" : ""} ${className ?? ""}`

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className={`${containerClass} text-left transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-zinc-800`}
      >
        <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
          {label}
        </p>
        <p
          className={`mt-2 truncate text-xl font-bold sm:text-2xl ${valueClassName ?? ""}`}
        >
          {value}
        </p>
        {children ? <div className="mt-2">{children}</div> : null}
      </button>
    )
  }

  return (
    <div className={containerClass}>
      <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={`mt-2 truncate text-xl font-bold sm:text-2xl ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  )
}
