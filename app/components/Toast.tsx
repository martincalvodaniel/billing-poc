"use client"

interface ToastProps {
  message: string
  onClose: () => void
}

export default function Toast({ message, onClose }: ToastProps) {
  return (
    <div className="fixed left-1/2 top-8 z-50 -translate-x-1/2 animate-[slideDown_0.3s_ease-out]">
      <div
        className="flex items-center gap-3 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 shadow-lg dark:border-green-800 dark:from-green-950/90 dark:to-emerald-950/90"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <svg
          className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium text-green-800 dark:text-green-300">
          {message}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="ml-auto rounded-md p-1 text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-green-400 dark:hover:text-green-300"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
