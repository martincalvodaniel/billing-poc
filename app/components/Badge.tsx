import type { ReactNode } from "react"
import {
  type BadgeSize,
  type BadgeTone,
  getBadgeSizeClass,
  getBadgeToneClass,
} from "./badge-utils"

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  size?: BadgeSize
  className?: string
}

export function Badge({
  children,
  tone = "neutral",
  size = "md",
  className,
}: BadgeProps) {
  const extra = className ? ` ${className}` : ""
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${getBadgeSizeClass(size)} ${getBadgeToneClass(tone)}${extra}`}
    >
      {children}
    </span>
  )
}
