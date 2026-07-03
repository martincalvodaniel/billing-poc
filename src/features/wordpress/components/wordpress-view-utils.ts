import type { BadgeTone } from "@/components/ui/badge-utils"
import { FetchError } from "@/lib/client/swr-fetcher"
import { formatCurrency, formatDate } from "@/lib/utils/formatters"

function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatAmount(value: string): string {
  return formatCurrency(parseAmount(value))
}

export function formatOrderDate(value: string): string {
  return value.length > 0 ? formatDate(value) : "-"
}

export function formatOrderTime(value: string): string {
  if (value.length === 0) return "-"

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return "-"
  }

  return parsedDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function getOrderStatusTone(status: string): BadgeTone {
  switch (status.toLowerCase()) {
    case "completed":
      return "success"
    case "processing":
      return "info"
    case "pending":
      return "warning"
    default:
      return "neutral"
  }
}

export function extractApiError(err: unknown, fallback: string): string {
  if (
    err instanceof FetchError &&
    err.info &&
    typeof err.info === "object" &&
    "error" in err.info &&
    typeof (err.info as { error: unknown }).error === "string"
  ) {
    return (err.info as { error: string }).error
  }

  if (err instanceof Error) {
    return err.message
  }

  return fallback
}
