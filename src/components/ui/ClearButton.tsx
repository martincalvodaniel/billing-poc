"use client"

interface ClearButtonProps {
  onClick: () => void
  ariaLabel: string
  disabled?: boolean
  className?: string
}

export default function ClearButton({
  onClick,
  ariaLabel,
  disabled,
  className = "",
}: ClearButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`absolute -top-2 -right-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-red-300 bg-white text-[10px] leading-none text-red-600 shadow-sm hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/60 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-900/30 ${className}`}
    >
      <span aria-hidden="true">×</span>
    </button>
  )
}
