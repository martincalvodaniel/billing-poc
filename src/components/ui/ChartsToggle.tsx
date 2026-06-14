export default function ChartsToggle({
  showCharts,
  onToggle,
}: {
  showCharts: boolean
  onToggle: (show: boolean) => void
}) {
  const enableCharts = () => onToggle(true)
  const hideCharts = () => onToggle(false)
  return (
    <fieldset
      className="inline-flex h-11 items-stretch overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700"
      aria-label="Toggle charts visibility"
    >
      <legend className="sr-only">Toggle charts visibility</legend>
      <span
        className="flex h-full items-center px-2 text-sm"
        aria-hidden="true"
      >
        📊
      </span>
      <button
        type="button"
        onClick={enableCharts}
        aria-pressed={showCharts}
        className={`h-full px-3 py-2 text-sm font-medium transition ${
          showCharts
            ? "bg-blue-600 text-white dark:bg-blue-700"
            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        }`}
      >
        Show
      </button>
      <button
        type="button"
        onClick={hideCharts}
        aria-pressed={!showCharts}
        className={`h-full px-3 py-2 text-sm font-medium transition ${
          !showCharts
            ? "bg-blue-600 text-white dark:bg-blue-700"
            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        }`}
      >
        Hide
      </button>
    </fieldset>
  )
}
