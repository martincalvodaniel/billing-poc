"use client"

import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"

export type ProductTagsKey = readonly ["/api/products/tags"]

interface ProductTagsResponse {
  tags: string[]
}

export function buildProductTagsKey(): ProductTagsKey {
  return ["/api/products/tags"] as const
}

export function buildProductTagsUrl(): string {
  return "/api/products/tags"
}

export function isProductTagsKey(key: unknown): key is ProductTagsKey {
  return (
    Array.isArray(key) && key.length === 1 && key[0] === "/api/products/tags"
  )
}

export interface UseProductTagsResult {
  tags: string[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<ProductTagsResponse>
}

export function useProductTags(): UseProductTagsResult {
  const { data, error, isLoading, mutate } = useSWR<ProductTagsResponse>(
    buildProductTagsKey(),
    () => fetcher<ProductTagsResponse>(buildProductTagsUrl())
  )

  return {
    tags: data?.tags ?? [],
    isLoading,
    error,
    mutate,
  }
}
