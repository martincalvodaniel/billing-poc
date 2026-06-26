"use client"

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react"
import { useStableCallback } from "@/hooks/useStableCallback"
import {
  getIconButtonClass,
  type IconButtonSize,
  type IconButtonVariant,
} from "./iconButton-utils"

interface IconLinkProps
  extends Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "aria-label" | "children" | "className" | "href"
  > {
  href: string
  ariaLabel: string
  children: ReactNode
  variant?: IconButtonVariant
  size?: IconButtonSize
  stopPropagation?: boolean
}

export function IconLink({
  href,
  ariaLabel,
  children,
  variant = "neutral",
  size = "sm",
  stopPropagation = false,
  onClick,
  ...anchorProps
}: IconLinkProps) {
  const handleClick = useStableCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (stopPropagation) {
        event.stopPropagation()
      }
      onClick?.(event)
    }
  )

  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={getIconButtonClass(variant, size)}
      onClick={onClick || stopPropagation ? handleClick : undefined}
      {...anchorProps}
    >
      {children}
    </a>
  )
}
