"use client"

import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"
import type { PaymentType } from "@/lib/domain/entities/payment"

export type TagType = PaymentType

export type TagsKey = readonly ["/api/tags", TagType]

interface TagsResponse {
  tags: string[]
}

export function buildTagsKey(type: TagType): TagsKey {
  return ["/api/tags", type] as const
}

export function buildTagsUrl(type: TagType): string {
  return `/api/tags?type=${encodeURIComponent(type)}`
}

export function isTagsKey(key: unknown): key is TagsKey {
  return (
    Array.isArray(key) &&
    key.length === 2 &&
    key[0] === "/api/tags" &&
    (key[1] === "income" || key[1] === "outcome")
  )
}

export interface UseTagsResult {
  tags: string[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<TagsResponse>
}

export function useTags(type: TagType): UseTagsResult {
  const { data, error, isLoading, mutate } = useSWR<TagsResponse>(
    buildTagsKey(type),
    (key: TagsKey) => fetcher<TagsResponse>(buildTagsUrl(key[1]))
  )

  return {
    tags: data?.tags ?? [],
    isLoading,
    error,
    mutate,
  }
}
