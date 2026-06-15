import type { SVGProps } from "react"

export function MarketSaleIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M2.5 6.5h11" />
      <path d="M3.4 6.5 4.2 3.7h7.6l.8 2.8" />
      <path d="M4.3 6.5v6h7.4v-6" />
      <path d="M6.1 12.5V9.9h3.8v2.6" />
      <path d="M10.5 4.7h1.2" />
      <path d="M11.5 8.9l.8-.8.8.8-.8.8z" />
    </svg>
  )
}
