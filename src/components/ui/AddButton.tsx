"use client"

interface AddButtonProps {
  onClick: () => void
  ariaLabel: string
  disabled?: boolean
  title?: string
}

export default function AddButton({
  onClick,
  ariaLabel,
  disabled,
  title,
}: AddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      title={title}
      className="inline-flex min-h-11 min-w-11 items-center justify-center whitespace-nowrap rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
    >
      <span aria-hidden="true">➕</span>
    </button>
  )
}
