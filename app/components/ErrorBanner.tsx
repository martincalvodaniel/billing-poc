import type { ReactNode } from "react"

interface ErrorBannerProps {
  children: ReactNode
  bordered?: boolean
  className?: string
}

export function ErrorBanner({
  children,
  bordered = false,
  className,
}: ErrorBannerProps) {
  const base =
    "rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
  const border = bordered ? " border border-red-200 dark:border-red-800" : ""
  const extra = className ? ` ${className}` : ""
  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`${base}${border}${extra}`}
    >
      {children}
    </div>
  )
}
