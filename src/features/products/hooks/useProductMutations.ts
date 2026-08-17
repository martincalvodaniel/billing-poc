"use client"

import { useSWRConfig } from "swr"
import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { FetchError } from "@/lib/client/swr-fetcher"
import type { ProductFormData } from "@/lib/domain/entities/product"
import { isProductsKey } from "./useProducts"
import { isProductTagsKey } from "./useProductTags"

export const PRODUCTS_ENDPOINT = "/api/products"

export type CreateProductInput = ProductFormData

export interface UpdateProductInput extends Partial<ProductFormData> {
  id: string
}

export interface DeleteProductInput {
  id: string
}

export interface CreateProductResponse {
  success: true
  id: string
}

export interface MutationResponse {
  success: true
}

export function buildProductsRequest<TBody>(
  method: "POST" | "PUT" | "DELETE",
  body: TBody
): { url: string; init: RequestInit } {
  return {
    url: PRODUCTS_ENDPOINT,
    init: {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    },
  }
}

async function sendJson<TBody, TResp>(
  method: "POST" | "PUT" | "DELETE",
  body: TBody
): Promise<TResp> {
  const { url, init } = buildProductsRequest(method, body)
  const response = await fetch(url, init)

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""
    let info: unknown = null
    if (contentType.includes("application/json")) {
      try {
        info = await response.json()
      } catch {
        info = null
      }
    } else {
      try {
        info = await response.text()
      } catch {
        info = null
      }
    }
    throw new FetchError(
      `${method} ${url} failed with status ${response.status}`,
      response.status,
      info
    )
  }

  return (await response.json()) as TResp
}

function useInvalidateProducts() {
  const { mutate } = useSWRConfig()
  return () => {
    void mutate(isProductsKey, undefined, { revalidate: true })
    void mutate(isProductTagsKey, undefined, { revalidate: true })
  }
}

export function useCreateProduct(): SWRMutationResponse<
  CreateProductResponse,
  unknown,
  typeof PRODUCTS_ENDPOINT,
  CreateProductInput
> {
  const invalidate = useInvalidateProducts()
  return useSWRMutation<
    CreateProductResponse,
    unknown,
    typeof PRODUCTS_ENDPOINT,
    CreateProductInput
  >(
    PRODUCTS_ENDPOINT,
    (_url, { arg }) =>
      sendJson<CreateProductInput, CreateProductResponse>("POST", arg),
    {
      onSuccess: () => {
        invalidate()
      },
    }
  )
}

export function useUpdateProduct(): SWRMutationResponse<
  MutationResponse,
  unknown,
  typeof PRODUCTS_ENDPOINT,
  UpdateProductInput
> {
  const invalidate = useInvalidateProducts()
  return useSWRMutation<
    MutationResponse,
    unknown,
    typeof PRODUCTS_ENDPOINT,
    UpdateProductInput
  >(
    PRODUCTS_ENDPOINT,
    (_url, { arg }) =>
      sendJson<UpdateProductInput, MutationResponse>("PUT", arg),
    {
      onSuccess: () => {
        invalidate()
      },
    }
  )
}

export function useDeleteProduct(): SWRMutationResponse<
  MutationResponse,
  unknown,
  typeof PRODUCTS_ENDPOINT,
  DeleteProductInput
> {
  const invalidate = useInvalidateProducts()
  return useSWRMutation<
    MutationResponse,
    unknown,
    typeof PRODUCTS_ENDPOINT,
    DeleteProductInput
  >(
    PRODUCTS_ENDPOINT,
    (_url, { arg }) =>
      sendJson<DeleteProductInput, MutationResponse>("DELETE", arg),
    {
      onSuccess: () => {
        invalidate()
      },
    }
  )
}
