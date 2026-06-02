interface WordpressBillingClientStatusMessagesProps {
  errorMessage: string | null
  hasDiffChanges: boolean
  hasSelectedClient: boolean
  selectedDiffCount: number
}

export function WordpressBillingClientStatusMessages({
  errorMessage,
  hasDiffChanges,
  hasSelectedClient,
  selectedDiffCount,
}: WordpressBillingClientStatusMessagesProps) {
  return (
    <>
      {!hasSelectedClient && (
        <p className="text-sm text-green-600 dark:text-green-300 ">
          Confirm will create a new client as Individual using billing name,
          phone and email.
        </p>
      )}

      {hasSelectedClient && !hasDiffChanges && (
        <p className="text-sm text-yellow-600 dark:text-yellow-300">
          Selected client already matches billing name, phone and email.
        </p>
      )}

      {hasSelectedClient && hasDiffChanges && selectedDiffCount === 0 && (
        <p className="text-sm text-red-600 dark:text-red-300">
          Select at least one mismatched field to update.
        </p>
      )}

      {errorMessage && (
        <p
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </>
  )
}
