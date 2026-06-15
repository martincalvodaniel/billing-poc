import type { ReactNode } from "react"

interface EmptyStateProps {
  children: ReactNode
  variant?: "inline" | "card"
  className?: string
}

export function EmptyState({
  children,
  variant = "inline",
  className,
}: EmptyStateProps) {
  const base =
    variant === "card"
      ? "rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400"
      : "text-center text-sm text-zinc-500 dark:text-zinc-400"
  const extra = className ? ` ${className}` : ""
  return <div className={`${base}${extra}`}>{children}</div>
}
