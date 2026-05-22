import useSWR, { type KeyedMutator } from "swr"
import type { Event } from "@/lib/domain/entities/event"
import { fetcher } from "@/lib/swr-fetcher"

export interface UseEventsArgs {
  year: number
  month?: number
}

// We use -1 as a sentinel for "no month" so the tuple shape stays stable
// across calls. SWR keys are compared by deep equality, and keeping the
// same arity/shape avoids accidental cache fragmentation.
export type EventsKey = readonly ["/api/events", number, number]

export function buildEventsKey({ year, month }: UseEventsArgs): EventsKey {
  return ["/api/events", year, month ?? -1] as const
}

export function buildEventsUrl({ year, month }: UseEventsArgs): string {
  const params = new URLSearchParams()
  params.set("year", String(year))
  if (month !== undefined) {
    params.set("month", String(month))
  }
  return `/api/events?${params.toString()}`
}

export function isEventsKey(key: unknown): boolean {
  return Array.isArray(key) && key[0] === "/api/events"
}

export interface EventsResponse {
  events: Event[]
}

export interface UseEventsResult {
  events: Event[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<EventsResponse>
}

export function useEvents(args: UseEventsArgs): UseEventsResult {
  const { data, error, isLoading, mutate } = useSWR<EventsResponse>(
    buildEventsKey(args),
    () => fetcher<EventsResponse>(buildEventsUrl(args))
  )

  return {
    events: data?.events ?? [],
    isLoading,
    error,
    mutate,
  }
}
