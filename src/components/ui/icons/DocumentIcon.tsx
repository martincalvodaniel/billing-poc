interface DocumentIconProps {
  className?: string
}

export function DocumentIcon({ className = "h-4 w-4" }: DocumentIconProps) {
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
        d="M7 3h7l5 5v13H7V3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 3v5h5M10 13h6M10 17h6"
      />
    </svg>
  )
}
