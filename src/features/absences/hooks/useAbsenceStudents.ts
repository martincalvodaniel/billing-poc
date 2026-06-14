"use client"

import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"

export type AbsenceStudentsKey = readonly ["/api/absences/students", string]

interface AbsenceStudentsResponse {
  students: string[]
}

export function buildAbsenceStudentsKey(q: string): AbsenceStudentsKey {
  return ["/api/absences/students", q] as const
}

export function buildAbsenceStudentsUrl(q: string): string {
  const trimmed = q.trim()
  if (trimmed === "") {
    return "/api/absences/students"
  }
  return `/api/absences/students?q=${encodeURIComponent(trimmed)}`
}

export function isAbsenceStudentsKey(key: unknown): key is AbsenceStudentsKey {
  return (
    Array.isArray(key) &&
    key.length === 2 &&
    key[0] === "/api/absences/students" &&
    typeof key[1] === "string"
  )
}

export interface UseAbsenceStudentsResult {
  students: string[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<AbsenceStudentsResponse>
}

export function useAbsenceStudents(q: string = ""): UseAbsenceStudentsResult {
  const { data, error, isLoading, mutate } = useSWR<AbsenceStudentsResponse>(
    buildAbsenceStudentsKey(q),
    (key: AbsenceStudentsKey) =>
      fetcher<AbsenceStudentsResponse>(buildAbsenceStudentsUrl(key[1]))
  )

  return {
    students: data?.students ?? [],
    isLoading,
    error,
    mutate,
  }
}
