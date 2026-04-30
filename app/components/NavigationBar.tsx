"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useCallback, useEffect, useRef, useState } from "react"

interface NavigationBarProps {
  subtitle: string
}

export default function NavigationBar({ subtitle }: NavigationBarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const buildLinkClass = (isActive: boolean) => {
    const base =
      "block rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
    const active =
      "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30"
    const inactive =
      "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
    return `${base} ${isActive ? active : inactive}`
  }

  const isMonthlyActive = pathname === "/" || pathname === "/month"
  const isYearActive = pathname === "/year"
  const isClientsActive = pathname === "/clients"

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // Close on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [menuOpen, closeMenu])

  return (
    <>
      <nav className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Billing
          </p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {subtitle}
          </p>
        </div>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/"
            className={buildLinkClass(isMonthlyActive)}
            aria-current={isMonthlyActive ? "page" : undefined}
          >
            Monthly Overview
          </Link>
          <Link
            href="/year"
            className={buildLinkClass(isYearActive)}
            aria-current={isYearActive ? "page" : undefined}
          >
            Yearly Overview
          </Link>
          <Link
            href="/clients"
            className={buildLinkClass(isClientsActive)}
            aria-current={isClientsActive ? "page" : undefined}
          >
            Clients
          </Link>
          {session?.user && (
            <>
              <div className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-7 w-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
              >
                Sign out
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation menu"
          className="min-h-11 min-w-11 rounded-md p-2 text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:hidden dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </nav>

      {/* Mobile sidebar overlay */}
      {menuOpen && (
        <div ref={overlayRef} className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/50"
          />

          {/* Sidebar panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute bottom-0 right-0 top-0 w-64 bg-white p-6 shadow-xl dark:bg-zinc-900"
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Billing
              </p>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close navigation menu"
                className="min-h-11 min-w-11 rounded-md p-2 text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              <Link
                href="/"
                className={buildLinkClass(isMonthlyActive)}
                aria-current={isMonthlyActive ? "page" : undefined}
              >
                Monthly Overview
              </Link>
              <Link
                href="/year"
                className={buildLinkClass(isYearActive)}
                aria-current={isYearActive ? "page" : undefined}
              >
                Yearly Overview
              </Link>
              <Link
                href="/clients"
                className={buildLinkClass(isClientsActive)}
                aria-current={isClientsActive ? "page" : undefined}
              >
                Clients
              </Link>
            </div>

            {session?.user && (
              <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <div className="mb-3 flex items-center gap-3">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {session.user.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {session.user.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
