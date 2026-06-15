"use client"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  hasPrevPage: boolean
  hasNextPage: boolean
  onPageChange: (page: number) => void
}

export default function PaginationControls({
  currentPage,
  totalPages,
  total,
  pageSize,
  hasPrevPage,
  hasNextPage,
  onPageChange,
}: PaginationControlsProps) {
  const showPreviousPage = () => onPageChange(currentPage - 1)
  const showNextPage = () => onPageChange(currentPage + 1)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, total)
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:justify-between">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        Showing{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {startItem}
        </span>{" "}
        to{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {endItem}
        </span>{" "}
        of{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {total}
        </span>{" "}
        clients
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={showPreviousPage}
          disabled={!hasPrevPage}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
          aria-label="Previous page"
        >
          Previous
        </button>

        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {currentPage}
          </span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">of</span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {totalPages}
          </span>
        </div>

        <button
          type="button"
          onClick={showNextPage}
          disabled={!hasNextPage}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  )
}
