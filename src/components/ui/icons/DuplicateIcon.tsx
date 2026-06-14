interface DuplicateIconProps {
  className?: string
}

export function DuplicateIcon({ className = "h-4 w-4" }: DuplicateIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="8"
        width="12"
        height="12"
        rx="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
      />
    </svg>
  )
}
