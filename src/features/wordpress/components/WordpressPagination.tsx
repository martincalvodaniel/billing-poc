interface WordpressPaginationData {
  page: number
  totalPages: number
  total: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface WordpressPaginationProps {
  pagination: WordpressPaginationData | undefined
  isLoading: boolean
  itemLabel?: string
  onPrevious: () => void
  onNext: () => void
}

export function WordpressPagination({
  pagination,
  isLoading,
  itemLabel = "orders",
  onPrevious,
  onNext,
}: WordpressPaginationProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isLoading || !pagination?.hasPrevPage}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
      >
        Previous
      </button>

      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        {pagination
          ? `Showing page ${pagination.page} of ${pagination.totalPages} (${pagination.total} ${itemLabel})`
          : "-"}
      </p>

      <button
        type="button"
        onClick={onNext}
        disabled={isLoading || !pagination?.hasNextPage}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
      >
        Next
      </button>
    </div>
  )
}
