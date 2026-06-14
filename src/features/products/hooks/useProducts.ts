"use client"

import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"
import type { Product } from "@/lib/domain/entities/product"

export type ProductsKey = readonly ["/api/products"]

interface ProductsResponse {
  products: Product[]
}

export function buildProductsKey(): ProductsKey {
  return ["/api/products"] as const
}

export function buildProductsUrl(): string {
  return "/api/products"
}

export function isProductsKey(key: unknown): key is ProductsKey {
  return Array.isArray(key) && key.length === 1 && key[0] === "/api/products"
}

export interface UseProductsResult {
  products: Product[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<ProductsResponse>
}

export function useProducts(): UseProductsResult {
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    buildProductsKey(),
    () => fetcher<ProductsResponse>(buildProductsUrl())
  )

  return {
    products: data?.products ?? [],
    isLoading,
    error,
    mutate,
  }
}
