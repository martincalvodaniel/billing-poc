"use client"

import { useEffect, useState } from "react"

export default function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
}: {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // On mobile (< 640px), collapse by default; on desktop, expand
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)")
    setIsExpanded(mql.matches)

    const handler = (e: MediaQueryListEvent) => setIsExpanded(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-300"
        aria-expanded={isExpanded}
      >
        {title}
        <span
          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {isExpanded && <div className="mt-4 space-y-6">{children}</div>}
    </div>
  )
}
