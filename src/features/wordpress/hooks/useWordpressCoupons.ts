"use client"

import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"
import type { WordPressCouponsResponse } from "@/lib/domain/entities/wordpress-coupon"

export interface UseWordpressCouponsArgs {
  page: number
}

export type WordpressCouponsKey = readonly ["/api/wordpress/coupons", number]

export function buildWordpressCouponsKey(
  args: UseWordpressCouponsArgs
): WordpressCouponsKey {
  return ["/api/wordpress/coupons", args.page] as const
}

export function buildWordpressCouponsUrl(
  args: UseWordpressCouponsArgs
): string {
  const params = new URLSearchParams({ page: String(args.page) })
  return `/api/wordpress/coupons?${params.toString()}`
}

export function isWordpressCouponsKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key.length === 2 &&
    key[0] === "/api/wordpress/coupons" &&
    typeof key[1] === "number"
  )
}

export function useWordpressCoupons(args: UseWordpressCouponsArgs): {
  data: WordPressCouponsResponse | undefined
  coupons: WordPressCouponsResponse["items"]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<WordPressCouponsResponse>
} {
  const { data, error, isLoading, mutate } = useSWR<WordPressCouponsResponse>(
    buildWordpressCouponsKey(args),
    () => fetcher<WordPressCouponsResponse>(buildWordpressCouponsUrl(args)),
    { keepPreviousData: true }
  )
  return {
    data,
    coupons: data?.items ?? [],
    isLoading,
    error,
    mutate,
  }
}
