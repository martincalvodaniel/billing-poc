"use client"

import { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"
import type { WordPressOrder } from "@/lib/domain/entities/wordpress-order"
import { FetchError } from "@/lib/swr-fetcher"
import { isWordpressOrdersKey } from "./useWordpressOrders"

const WORDPRESS_ORDERS_ENDPOINT = "/api/wordpress/orders"

export interface UpdateWordpressOrderStatusInput {
  orderId: number
  status: "completed"
}

export interface UpdateWordpressOrderStatusResponse {
  success: true
  order: WordPressOrder
}

export function buildUpdateWordpressOrderStatusRequest(
  input: UpdateWordpressOrderStatusInput
): { url: string; init: RequestInit } {
  return {
    url: `${WORDPRESS_ORDERS_ENDPOINT}/${input.orderId}`,
    init: {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status: input.status }),
    },
  }
}

async function updateWordpressOrderStatusFetcher(
  input: UpdateWordpressOrderStatusInput
): Promise<UpdateWordpressOrderStatusResponse> {
  const { url, init } = buildUpdateWordpressOrderStatusRequest(input)
  const response = await fetch(url, init)

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""
    let info: unknown
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
      `PUT ${url} failed with status ${response.status}`,
      response.status,
      info
    )
  }

  return (await response.json()) as UpdateWordpressOrderStatusResponse
}

export function useUpdateWordpressOrderStatus() {
  const { mutate } = useSWRConfig()
  return useSWRMutation<
    UpdateWordpressOrderStatusResponse,
    Error,
    typeof WORDPRESS_ORDERS_ENDPOINT,
    UpdateWordpressOrderStatusInput
  >(
    WORDPRESS_ORDERS_ENDPOINT,
    (_url, { arg }) => updateWordpressOrderStatusFetcher(arg),
    {
      onSuccess: () => {
        mutate(isWordpressOrdersKey, undefined, { revalidate: true })
      },
    }
  )
}
