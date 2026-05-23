export type IconButtonVariant = "danger" | "neutral" | "success"
export type IconButtonSize = "sm" | "md"

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
  danger:
    "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus-visible:ring-red-500",
  success:
    "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 focus-visible:ring-emerald-500",
  neutral:
    "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-zinc-500",
}

const SIZE_CLASS: Record<IconButtonSize, string> = {
  sm: "p-1.5",
  md: "p-2",
}

const BASE_CLASS =
  "rounded-md focus:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"

export function getIconButtonClass(
  variant: IconButtonVariant,
  size: IconButtonSize
): string {
  return `${BASE_CLASS} ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]}`
}
