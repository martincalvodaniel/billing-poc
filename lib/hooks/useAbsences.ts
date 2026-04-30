import useSWR, { type KeyedMutator } from "swr"
import type { Absence } from "@/lib/domain/entities/absence"
import { fetcher } from "@/lib/swr-fetcher"

export interface UseAbsencesArgs {
  year: number
  month?: number
}

// We use -1 as a sentinel for "no month" so the tuple shape stays stable
// across calls. SWR keys are compared by deep equality, and keeping the
// same arity/shape avoids accidental cache fragmentation.
export type AbsencesKey = readonly ["/api/absences", number, number]

export function buildAbsencesKey({
  year,
  month,
}: UseAbsencesArgs): AbsencesKey {
  return ["/api/absences", year, month ?? -1] as const
}

export function buildAbsencesUrl({ year, month }: UseAbsencesArgs): string {
  const params = new URLSearchParams()
  params.set("year", String(year))
  if (month !== undefined) {
    params.set("month", String(month))
  }
  return `/api/absences?${params.toString()}`
}

export function isAbsencesKey(key: unknown): key is AbsencesKey {
  return (
    Array.isArray(key) &&
    key.length === 3 &&
    key[0] === "/api/absences" &&
    typeof key[1] === "number" &&
    typeof key[2] === "number"
  )
}

export interface AbsencesResponse {
  absences: Absence[]
}

export interface UseAbsencesResult {
  absences: Absence[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<AbsencesResponse>
}

export function useAbsences(args: UseAbsencesArgs): UseAbsencesResult {
  const { data, error, isLoading, mutate } = useSWR<AbsencesResponse>(
    buildAbsencesKey(args),
    () => fetcher<AbsencesResponse>(buildAbsencesUrl(args))
  )

  return {
    absences: data?.absences ?? [],
    isLoading,
    error,
    mutate,
  }
}
