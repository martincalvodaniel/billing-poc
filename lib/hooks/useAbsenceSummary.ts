import useSWR, { type KeyedMutator } from "swr"
import type { AbsenceSummaryRow } from "@/lib/domain/entities/absence"
import { fetcher } from "@/lib/swr-fetcher"

export type AbsenceSummaryKey = readonly ["/api/absences/summary"]

interface AbsenceSummaryResponse {
  rows: AbsenceSummaryRow[]
}

export function buildAbsenceSummaryKey(): AbsenceSummaryKey {
  return ["/api/absences/summary"] as const
}

export function buildAbsenceSummaryUrl(): string {
  return "/api/absences/summary"
}

export function isAbsenceSummaryKey(key: unknown): key is AbsenceSummaryKey {
  return (
    Array.isArray(key) && key.length === 1 && key[0] === "/api/absences/summary"
  )
}

export interface UseAbsenceSummaryResult {
  rows: AbsenceSummaryRow[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<AbsenceSummaryResponse>
}

export function useAbsenceSummary(): UseAbsenceSummaryResult {
  const { data, error, isLoading, mutate } = useSWR<AbsenceSummaryResponse>(
    buildAbsenceSummaryKey(),
    () => fetcher<AbsenceSummaryResponse>(buildAbsenceSummaryUrl())
  )

  return {
    rows: data?.rows ?? [],
    isLoading,
    error,
    mutate,
  }
}
