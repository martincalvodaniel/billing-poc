import { FetchError } from "@/lib/swr-fetcher"

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FetchError) {
    const info = error.info as { error?: string } | null
    if (info && typeof info.error === "string") return info.error
    return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}
