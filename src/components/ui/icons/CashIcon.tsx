import type { SVGProps } from "react"

export function CashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="h-4 w-4"
      {...props}
    >
      <rect x="1.5" y="3" width="13" height="10" rx="2" />
      <circle cx="8" cy="8" r="1.8" />
      <path d="M4 5.2h.2M11.8 10.8H12" />
    </svg>
  )
}
