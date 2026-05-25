import { Badge } from "@/app/components/Badge"

interface DayPillProps {
  count: number
  kind: "absence" | "recovery"
}

export default function DayPill({ count, kind }: DayPillProps) {
  if (count <= 0) return null
  const isAbsence = kind === "absence"
  const tone = isAbsence ? "danger" : "success"
  const dotClass = isAbsence ? "bg-red-500" : "bg-green-500"
  return (
    <Badge tone={tone} size="sm">
      <span
        aria-hidden="true"
        className={`mr-1 h-1.5 w-1.5 rounded-full ${dotClass}`}
      />
      {count}
    </Badge>
  )
}
