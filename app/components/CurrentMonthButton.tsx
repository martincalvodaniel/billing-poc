export default function CurrentMonthButton({
  selectedDate,
  showCalendar,
  onToggle,
}: {
  selectedDate: Date
  showCalendar: boolean
  onToggle: () => void
}) {
  const formattedLabel = selectedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  })

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Select month, currently viewing ${formattedLabel}`}
      aria-expanded={showCalendar}
      className="min-h-11 w-[7.5rem] rounded-lg border border-zinc-200 px-4 py-2 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
    >
      {formattedLabel}
    </button>
  )
}
