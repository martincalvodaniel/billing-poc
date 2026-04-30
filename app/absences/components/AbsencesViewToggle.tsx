"use client"

export type AbsencesView = "month" | "week" | "summary"

interface AbsencesViewToggleProps {
  value: AbsencesView
  onChange: (value: AbsencesView) => void
}

const SEGMENTS: { value: AbsencesView; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "summary", label: "Summary" },
]

export default function AbsencesViewToggle({
  value,
  onChange,
}: AbsencesViewToggleProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: <fieldset> would alter layout; role="group" is appropriate here
    <div
      role="group"
      aria-label="Absences view"
      className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
    >
      {SEGMENTS.map((segment) => {
        const selected = segment.value === value
        return (
          <button
            key={segment.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(segment.value)}
            className={`min-h-9 rounded-md px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
              selected
                ? "bg-blue-600 text-white shadow-sm dark:bg-blue-700"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {segment.label}
          </button>
        )
      })}
    </div>
  )
}
