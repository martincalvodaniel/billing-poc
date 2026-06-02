import useSWR, { type KeyedMutator } from "swr"
import type { WordPressOrdersResponse } from "@/lib/domain/entities/wordpress-order"
import { fetcher } from "@/lib/swr-fetcher"

export interface UseWordpressOrdersArgs {
  page: number
}

export type WordpressOrdersKey = readonly ["/api/wordpress/orders", number]

export interface UseWordpressOrdersResult {
  data: WordPressOrdersResponse | undefined
  orders: WordPressOrdersResponse["items"]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<WordPressOrdersResponse>
}

export function buildWordpressOrdersKey(
  args: UseWordpressOrdersArgs
): WordpressOrdersKey {
  return ["/api/wordpress/orders", args.page] as const
}

export function buildWordpressOrdersUrl(args: UseWordpressOrdersArgs): string {
  const params = new URLSearchParams({ page: String(args.page) })
  return `/api/wordpress/orders?${params.toString()}`
}

export function isWordpressOrdersKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key.length === 2 &&
    key[0] === "/api/wordpress/orders" &&
    typeof key[1] === "number"
  )
}

export function useWordpressOrders(
  args: UseWordpressOrdersArgs
): UseWordpressOrdersResult {
  const { data, error, isLoading, mutate } = useSWR<WordPressOrdersResponse>(
    buildWordpressOrdersKey(args),
    () => fetcher<WordPressOrdersResponse>(buildWordpressOrdersUrl(args)),
    { keepPreviousData: true }
  )

  return {
    data,
    orders: data?.items ?? [],
    isLoading,
    error,
    mutate,
  }
}
