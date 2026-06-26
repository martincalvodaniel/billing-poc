"use client"

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { CheckIcon } from "@/components/ui/icons/CheckIcon"
import { CopyIcon } from "@/components/ui/icons/CopyIcon"

interface CopyToClipboardButtonProps {
  ariaLabel: string
  children?: ReactNode
  className?: string
  copiedTitle?: string
  disabled?: boolean
  iconClassName?: string
  onCopied?: () => void
  onCopyError?: () => void
  showIcon?: boolean
  stopPropagation?: boolean
  title?: string
  value: string
}

async function copyToClipboard(value: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false
  }

  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

export function CopyToClipboardButton({
  ariaLabel,
  children,
  className = "inline-flex items-center justify-center rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:disabled:hover:bg-transparent dark:disabled:hover:text-zinc-400",
  copiedTitle = "Copied",
  disabled = false,
  iconClassName = "h-4 w-4",
  onCopied,
  onCopyError,
  showIcon = true,
  stopPropagation = false,
  title,
  value,
}: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (stopPropagation) {
        event.stopPropagation()
      }

      if (disabled || value.length === 0) {
        return
      }

      const copiedSuccessfully = await copyToClipboard(value)
      if (!copiedSuccessfully) {
        onCopyError?.()
        return
      }

      setCopied(true)
      onCopied?.()
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    },
    [disabled, onCopied, onCopyError, stopPropagation, value]
  )

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={copied ? copiedTitle : title}
      className={className}
    >
      {children ? <span className="min-w-0">{children}</span> : null}
      {showIcon ? (
        copied ? (
          <CheckIcon className={iconClassName} />
        ) : (
          <CopyIcon className={iconClassName} />
        )
      ) : null}
    </button>
  )
}
