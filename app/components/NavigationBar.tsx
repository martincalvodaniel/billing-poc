"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationBarProps {
  subtitle: string;
}

export default function NavigationBar({ subtitle }: NavigationBarProps) {
  const pathname = usePathname();

  const buildLinkClass = (isActive: boolean) => {
    const base = "rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900";
    const active = "text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30";
    const inactive = "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800";
    return `${base} ${isActive ? active : inactive}`;
  };

  const isMonthlyActive = pathname === "/" || pathname === "/month";
  const isYearActive = pathname === "/year";
  const isClientsActive = pathname === "/clients";

  return (
    <nav className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Billing</p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className={buildLinkClass(isMonthlyActive)}
          aria-current={isMonthlyActive ? "page" : undefined}
        >
          Monthly list
        </Link>
        <Link
          href="/year"
          className={buildLinkClass(isYearActive)}
          aria-current={isYearActive ? "page" : undefined}
        >
          Year summary
        </Link>
        <Link
          href="/clients"
          className={buildLinkClass(isClientsActive)}
          aria-current={isClientsActive ? "page" : undefined}
        >
          Clients
        </Link>
      </div>
    </nav>
  );
}