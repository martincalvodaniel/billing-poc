"use client"

import type { MouseEvent, ReactNode } from "react"
import { useStableCallback } from "@/hooks/useStableCallback"
import {
  getIconButtonClass,
  type IconButtonSize,
  type IconButtonVariant,
} from "./iconButton-utils"

interface IconButtonProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  onMouseDown?: (e: MouseEvent<HTMLButtonElement>) => void
  ariaLabel: string
  children: ReactNode
  variant?: IconButtonVariant
  size?: IconButtonSize
  disabled?: boolean
  isPending?: boolean
  title?: string
  type?: "button" | "submit"
  stopPropagation?: boolean
}

export function IconButton({
  onClick,
  onMouseDown,
  ariaLabel,
  children,
  variant = "neutral",
  size = "sm",
  disabled = false,
  isPending = false,
  title,
  type = "button",
  stopPropagation = false,
}: IconButtonProps) {
  const handleClick = useStableCallback((e: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      e.stopPropagation()
    }
    onClick(e)
  })

  return (
    <button
      type={type}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      aria-label={ariaLabel}
      aria-busy={isPending}
      disabled={disabled || isPending}
      title={title}
      className={getIconButtonClass(variant, size)}
    >
      {children}
    </button>
  )
}
