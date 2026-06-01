import { IconButton } from "@/app/components/IconButton"

interface WordpressOrdersHeaderProps {
  onReload: () => void
  isReloadDisabled: boolean
}

export function WordpressOrdersHeader({
  onReload,
  isReloadDisabled,
}: WordpressOrdersHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          WordPress Orders
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Summary view with billing, items, and taxes available in details.
        </p>
      </div>

      <IconButton
        onClick={onReload}
        ariaLabel="Reload orders and go to page 1"
        title="Reload"
        size="md"
        variant="info"
        disabled={isReloadDisabled}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
      </IconButton>
    </div>
  )
}
