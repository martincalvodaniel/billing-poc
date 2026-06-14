import type { SVGProps } from "react"

export function BankTransferIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M2 5.5h9" />
      <path d="M9 3.5l2 2-2 2" />
      <path d="M14 10.5H5" />
      <path d="M7 8.5l-2 2 2 2" />
    </svg>
  )
}
