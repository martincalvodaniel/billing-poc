export type BadgeTone = "neutral" | "info" | "success" | "danger" | "warning"
export type BadgeSize = "sm" | "md"

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  success:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
}

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-xs",
}

export function getBadgeToneClass(tone: BadgeTone): string {
  return TONE_CLASS[tone]
}

export function getBadgeSizeClass(size: BadgeSize): string {
  return SIZE_CLASS[size]
}
