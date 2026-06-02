interface WordpressBillingClientModalFooterProps {
  confirmLabel: string
  isConfirmDisabled: boolean
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
  pendingLabel: string
}

export function WordpressBillingClientModalFooter({
  confirmLabel,
  isConfirmDisabled,
  isSubmitting,
  onCancel,
  onConfirm,
  pendingLabel,
}: WordpressBillingClientModalFooterProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isConfirmDisabled}
        aria-busy={isSubmitting}
        className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-zinc-900"
      >
        {isSubmitting ? pendingLabel : confirmLabel}
      </button>
    </div>
  )
}
