import type { Event } from "@/lib/domain/entities/event"
import { FetchError } from "@/lib/swr-fetcher"

export interface EventsFormState {
  open: boolean
  mode: "create" | "edit"
  event?: Event
}

export function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

export function toRequiredNumber(value: string): number {
  const n = Number(value.trim())
  return Number.isFinite(n) ? n : 0
}

export function extractEventErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof FetchError) {
    const info = error.info as { error?: string } | null
    if (info && typeof info.error === "string") return info.error
    return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}
