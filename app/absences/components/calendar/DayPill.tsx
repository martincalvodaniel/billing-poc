interface DayPillProps {
  count: number
  kind: "absence" | "recovery"
}

export default function DayPill({ count, kind }: DayPillProps) {
  if (count <= 0) return null
  const isAbsence = kind === "absence"
  const pillClass = isAbsence
    ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
    : "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
  const dotClass = isAbsence ? "bg-red-500" : "bg-green-500"
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${pillClass}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${dotClass}`}
      />
      {count}
    </span>
  )
}
