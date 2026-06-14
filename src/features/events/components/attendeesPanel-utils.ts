import { FetchError } from "@/lib/client/swr-fetcher"
import type { EventAttendee } from "@/lib/domain/entities/event"

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FetchError) {
    const info = error.info as { error?: string } | null
    if (info && typeof info.error === "string") return info.error
    return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

export interface AttendeeEmailClient {
  _id?: unknown
  email?: string
}

export function buildAttendeeEmailsString(
  attendees: readonly EventAttendee[],
  clients: readonly AttendeeEmailClient[]
): string {
  const emailByClientId = new Map<string, string>()
  for (const c of clients) {
    if (c._id === undefined || c._id === null) continue
    const email = c.email?.trim()
    if (!email) continue
    emailByClientId.set(String(c._id), email)
  }
  const emails: string[] = []
  for (const attendee of attendees) {
    const email = emailByClientId.get(attendee.clientId)
    if (email) emails.push(email)
  }
  return emails.join(", ")
}
