"use client";

import { ButtonHTMLAttributes } from "react";

type NavButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function NavButton({ children, className, ...props }: NavButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}
