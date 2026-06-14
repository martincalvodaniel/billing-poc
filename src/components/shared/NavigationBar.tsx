"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { signOut, useSession } from "@/lib/auth/auth-client"
import MobileMenuOverlay, { type NavItem } from "./MobileMenuOverlay"

interface NavigationBarProps {
  subtitle: string
}
const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/absences",
    label: "Absences",
    matches: (p) => p === "/absences",
  },
  {
    href: "/clients",
    label: "Clients",
    matches: (p) => p === "/clients",
  },
  {
    href: "/products",
    label: "Products",
    matches: (p) => p === "/products",
  },
  {
    href: "/events",
    label: "Events",
    matches: (p) => p === "/events",
  },
  {
    href: "/month",
    label: "Month",
    matches: (p) => p === "/" || p === "/month",
  },
  {
    href: "/year",
    label: "Year",
    matches: (p) => p === "/year",
  },
  {
    href: "/wordpress",
    label: "WordPress",
    matches: (p) => p === "/wordpress",
  },
]
export default function NavigationBar({ subtitle }: NavigationBarProps) {
  const handleMenuOpenChange = () => setMenuOpen(true)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const handleSignOut = useCallback(() => {
    signOut({
      fetchOptions: {
        onSuccess: () => router.push("/auth/signin"),
      },
    })
  }, [router])
  const buildLinkClass = (isActive: boolean) => {
    const base =
      "block rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
    const active =
      "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30"
    const inactive =
      "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
    return `${base} ${isActive ? active : inactive}`
  }
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  // Close on Escape (when the mobile menu is open)
  useEscapeKey(closeMenu, menuOpen)
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
          {NAV_ITEMS.map((item) => {
            const isActive = item.matches(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={buildLinkClass(isActive)}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            )
          })}
          {session?.user ? (
            <>
              <div className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User avatar"}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
              >
                Sign out
              </button>
            </>
          ) : null}
        </div>

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={handleMenuOpenChange}
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

      {menuOpen ? (
        <MobileMenuOverlay
          items={NAV_ITEMS}
          pathname={pathname}
          session={session}
          buildLinkClass={buildLinkClass}
          onClose={closeMenu}
          onSignOut={handleSignOut}
        />
      ) : null}
    </>
  )
}
