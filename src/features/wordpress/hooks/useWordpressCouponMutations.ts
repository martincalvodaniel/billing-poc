"use client"

import { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"
import { FetchError } from "@/lib/client/swr-fetcher"
import type { WordPressCoupon } from "@/lib/domain/entities/wordpress-coupon"
import { isWordpressCouponsKey } from "./useWordpressCoupons"

const WORDPRESS_COUPONS_ENDPOINT = "/api/wordpress/coupons"

export interface CreateWordpressCouponInput {
  description: string
  amount: string
  dateExpires: string
}

export interface DeleteWordpressCouponInput {
  couponId: number
}

interface CouponMutationResponse {
  success: true
  coupon: WordPressCoupon
}

export function buildCreateWordpressCouponRequest(
  input: CreateWordpressCouponInput
): { url: string; init: RequestInit } {
  return {
    url: WORDPRESS_COUPONS_ENDPOINT,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(input),
    },
  }
}

export function buildDeleteWordpressCouponRequest(
  input: DeleteWordpressCouponInput
): { url: string; init: RequestInit } {
  return {
    url: `${WORDPRESS_COUPONS_ENDPOINT}/${input.couponId}`,
    init: {
      method: "DELETE",
      credentials: "same-origin",
    },
  }
}

async function sendCouponRequest(request: {
  url: string
  init: RequestInit
}): Promise<CouponMutationResponse> {
  const response = await fetch(request.url, request.init)
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""
    let info: unknown = null
    try {
      info = contentType.includes("application/json")
        ? await response.json()
        : await response.text()
    } catch {
      info = null
    }
    throw new FetchError(
      `${request.init.method} ${request.url} failed with status ${response.status}`,
      response.status,
      info
    )
  }
  return (await response.json()) as CouponMutationResponse
}

function useInvalidateWordpressCoupons() {
  const { mutate } = useSWRConfig()
  return () => mutate(isWordpressCouponsKey, undefined, { revalidate: true })
}

export function useCreateWordpressCoupon() {
  const invalidate = useInvalidateWordpressCoupons()
  return useSWRMutation<
    CouponMutationResponse,
    Error,
    typeof WORDPRESS_COUPONS_ENDPOINT,
    CreateWordpressCouponInput
  >(
    WORDPRESS_COUPONS_ENDPOINT,
    (_url, { arg }) =>
      sendCouponRequest(buildCreateWordpressCouponRequest(arg)),
    { onSuccess: invalidate }
  )
}

export function useDeleteWordpressCoupon() {
  const invalidate = useInvalidateWordpressCoupons()
  return useSWRMutation<
    CouponMutationResponse,
    Error,
    typeof WORDPRESS_COUPONS_ENDPOINT,
    DeleteWordpressCouponInput
  >(
    WORDPRESS_COUPONS_ENDPOINT,
    (_url, { arg }) =>
      sendCouponRequest(buildDeleteWordpressCouponRequest(arg)),
    { onSuccess: invalidate }
  )
}
