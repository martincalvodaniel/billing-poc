import type { SVGProps } from "react"

export function CardIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M1.5 6.3h13" />
      <path d="M4 10h3.2" />
    </svg>
  )
}
