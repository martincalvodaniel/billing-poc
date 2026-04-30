interface CloseButtonProps {
  onClick: () => void
  label?: string
}

export default function CloseButton({
  onClick,
  label = "Close",
}: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
      </svg>
    </button>
  )
}
