import useSWR, { type KeyedMutator } from "swr"
import type { Absence } from "@/lib/domain/entities/absence"
import { fetcher } from "@/lib/swr-fetcher"

export interface UseAbsencesArgs {
  year?: number
  month?: number
  studentName?: string
}

// We use sentinels (-1 for missing year/month, "" for missing studentName) so
// the tuple shape stays stable across calls. SWR keys are compared by deep
// equality, and keeping the same arity/shape avoids cache fragmentation.
export type AbsencesKey = readonly ["/api/absences", number, number, string]

export function buildAbsencesKey({
  year,
  month,
  studentName,
}: UseAbsencesArgs): AbsencesKey {
  return ["/api/absences", year ?? -1, month ?? -1, studentName ?? ""] as const
}

export function buildAbsencesUrl({
  year,
  month,
  studentName,
}: UseAbsencesArgs): string {
  const parts: string[] = []
  if (year !== undefined) {
    parts.push(`year=${year}`)
  }
  if (month !== undefined) {
    parts.push(`month=${month}`)
  }
  if (studentName !== undefined && studentName !== "") {
    parts.push(`studentName=${encodeURIComponent(studentName)}`)
  }
  return parts.length > 0 ? `/api/absences?${parts.join("&")}` : "/api/absences"
}

export function isAbsencesKey(key: unknown): key is AbsencesKey {
  return (
    Array.isArray(key) &&
    key.length === 4 &&
    key[0] === "/api/absences" &&
    typeof key[1] === "number" &&
    typeof key[2] === "number" &&
    typeof key[3] === "string"
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
