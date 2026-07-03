"use client"

import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"

export type EventTagsKey = readonly ["/api/tags", "income"]

interface TagsResponse {
  tags: string[]
}

export function buildEventTagsKey(): EventTagsKey {
  return ["/api/tags", "income"] as const
}

export function buildEventTagsUrl(): string {
  return "/api/tags?type=income"
}

export function isEventTagsKey(key: unknown): key is EventTagsKey {
  return (
    Array.isArray(key) &&
    key.length === 2 &&
    key[0] === "/api/tags" &&
    key[1] === "income"
  )
}

export interface UseEventTagsResult {
  tags: string[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<TagsResponse>
}

export function useEventTags(): UseEventTagsResult {
  const { data, error, isLoading, mutate } = useSWR<TagsResponse>(
    buildEventTagsKey(),
    () => fetcher<TagsResponse>(buildEventTagsUrl())
  )

  return {
    tags: data?.tags ?? [],
    isLoading,
    error,
    mutate,
  }
}
