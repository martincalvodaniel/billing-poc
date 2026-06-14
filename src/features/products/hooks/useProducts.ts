"use client"

import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"
import type { Product } from "@/lib/domain/entities/product"

export interface UseProductsArgs {
  search?: string
}

export type ProductsKey = readonly ["/api/products", string]

interface ProductsResponse {
  products: Product[]
}

const DEFAULT_SEARCH = ""

export function buildProductsKey(args: UseProductsArgs = {}): ProductsKey {
  return ["/api/products", args.search ?? DEFAULT_SEARCH] as const
}

export function buildProductsUrl(args: UseProductsArgs = {}): string {
  const params = new URLSearchParams()
  if (args.search?.trim()) {
    params.set("search", args.search.trim())
  }
  const query = params.toString()
  return query.length > 0 ? `/api/products?${query}` : "/api/products"
}

export function isProductsKey(key: unknown): key is ProductsKey {
  return (
    Array.isArray(key) &&
    key.length === 2 &&
    key[0] === "/api/products" &&
    typeof key[1] === "string"
  )
}

export interface UseProductsResult {
  products: Product[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<ProductsResponse>
}

export function useProducts(args: UseProductsArgs = {}): UseProductsResult {
  const search = args.search ?? DEFAULT_SEARCH
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    buildProductsKey({ search }),
    () => fetcher<ProductsResponse>(buildProductsUrl({ search }))
  )

  return {
    products: data?.products ?? [],
    isLoading,
    error,
    mutate,
  }
}
