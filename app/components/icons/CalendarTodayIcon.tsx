interface CalendarTodayIconProps {
  className?: string
}

export function CalendarTodayIcon({
  className = "h-4 w-4",
}: CalendarTodayIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M16 2v4M8 2v4" />
      <path strokeLinecap="round" strokeWidth={2} d="M3 10h18" />
      <rect x="10" y="14" width="4" height="4" rx="0.5" fill="currentColor" strokeWidth={0} />
    </svg>
  )
}
