"use client"

import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"
import type { Product } from "@/lib/domain/entities/product"

export interface UseProductsArgs {
  search?: string
  tags?: string[]
}

export type ProductsKey = readonly ["/api/products", string, string]

interface ProductsResponse {
  products: Product[]
}

const DEFAULT_SEARCH = ""

export function buildProductsKey(args: UseProductsArgs = {}): ProductsKey {
  const tags = normalizeTags(args.tags).join("\u001f")
  return ["/api/products", args.search ?? DEFAULT_SEARCH, tags] as const
}

export function buildProductsUrl(args: UseProductsArgs = {}): string {
  const params = new URLSearchParams()
  if (args.search?.trim()) {
    params.set("search", args.search.trim())
  }
  for (const tag of normalizeTags(args.tags)) {
    params.append("tag", tag)
  }
  const query = params.toString()
  return query.length > 0 ? `/api/products?${query}` : "/api/products"
}

export function isProductsKey(key: unknown): key is ProductsKey {
  return (
    Array.isArray(key) &&
    key.length === 3 &&
    key[0] === "/api/products" &&
    typeof key[1] === "string" &&
    typeof key[2] === "string"
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
  const tags = normalizeTags(args.tags)
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    buildProductsKey({ search, tags }),
    () => fetcher<ProductsResponse>(buildProductsUrl({ search, tags }))
  )

  return {
    products: data?.products ?? [],
    isLoading,
    error,
    mutate,
  }
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags || tags.length === 0) return []
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))
  ).sort((a, b) => a.localeCompare(b))
}
