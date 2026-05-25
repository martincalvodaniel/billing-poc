interface GeneratePaymentsIconProps {
  className?: string
}

export function GeneratePaymentsIcon({
  className = "h-4 w-4",
}: GeneratePaymentsIconProps) {
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
        d="M18 6.5C16.5 5 14.7 4.25 12.8 4.25c-3.7 0-6.8 3.47-6.8 7.75s3.1 7.75 6.8 7.75c1.9 0 3.7-.75 5.2-2.25M4 10.5h10M4 13.5h9"
      />
    </svg>
  )
}
