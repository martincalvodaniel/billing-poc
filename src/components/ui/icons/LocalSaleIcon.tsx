import type { SVGProps } from "react"

export function LocalSaleIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M2 7h12" />
      <path d="M3 7V5.6L8 3l5 2.6V7" />
      <path d="M3 7v6h10V7" />
      <path d="M5.5 13v-3.5h5V13" />
      <path d="M6.6 6.2h2.8" />
      <path d="M11.2 9.1h1" />
    </svg>
  )
}
