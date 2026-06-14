import { CheckIcon, XIcon } from "../icons"

interface FormHeaderProps {
  title: string
  submitTooltip: string
  isSubmitting: boolean
  canSubmit: boolean
  onCancel?: () => void
}

export default function FormHeader({
  title,
  submitTooltip,
  isSubmitting,
  canSubmit,
  onCancel,
}: FormHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <div className="flex shrink-0 items-center gap-1">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            title="Cancel"
            aria-label="Cancel"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
          >
            <XIcon />
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          aria-busy={isSubmitting}
          title={submitTooltip}
          aria-label={submitTooltip}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
        >
          <CheckIcon />
        </button>
      </div>
    </div>
  )
}
