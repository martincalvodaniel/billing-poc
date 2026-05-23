import type { ClientType } from "@/lib/types"

interface ClientTypeIconProps {
  type: ClientType
  className?: string
}

export function ClientTypeIcon({
  type,
  className = "h-4 w-4",
}: ClientTypeIconProps) {
  if (type === "company") {
    return (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"
        />
      </svg>
    )
  }
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 11a4 4 0 11-8 0 4 4 0 018 0zM4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
      />
    </svg>
  )
}
