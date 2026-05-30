import { mutate } from "swr"
import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { isPaymentKey, isPaymentsKey } from "@/lib/hooks/usePayments"
import { FetchError } from "@/lib/swr-fetcher"

export interface SetProviderBillLinkInput {
  paymentId: string
  url: string | null
}

export interface SetProviderBillLinkResult {
  success: boolean
  providerBillLink: string | null
}

export function buildSetProviderBillLinkUrl(paymentId: string): string {
  return `/api/payments/${encodeURIComponent(paymentId)}/provider-bill`
}

export function buildSetProviderBillLinkBody({ url }: { url: string | null }): {
  url: string | null
} {
  return { url }
}

async function parseError(
  response: Response,
  fallback: string
): Promise<never> {
  let info: unknown = null
  const contentType = response.headers.get("content-type") ?? ""
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
  const message =
    info && typeof info === "object" && "error" in info
      ? String((info as { error: unknown }).error)
      : fallback
  throw new FetchError(message, response.status, info)
}

export async function setProviderBillLinkFetcher(
  _key: string,
  { arg }: { arg: SetProviderBillLinkInput }
): Promise<SetProviderBillLinkResult> {
  const response = await fetch(buildSetProviderBillLinkUrl(arg.paymentId), {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildSetProviderBillLinkBody({ url: arg.url })),
  })
  if (!response.ok) {
    await parseError(response, "Failed to update provider bill link")
  }
  return (await response.json()) as SetProviderBillLinkResult
}

async function invalidatePayments(): Promise<void> {
  await Promise.all([
    mutate(isPaymentsKey, undefined, { revalidate: true }),
    mutate(isPaymentKey, undefined, { revalidate: true }),
  ])
}

export type UseSetProviderBillLinkResult = SWRMutationResponse<
  SetProviderBillLinkResult,
  Error,
  "/api/payments/provider-bill",
  SetProviderBillLinkInput
>

export function useSetProviderBillLink(): UseSetProviderBillLinkResult {
  return useSWRMutation<
    SetProviderBillLinkResult,
    Error,
    "/api/payments/provider-bill",
    SetProviderBillLinkInput
  >("/api/payments/provider-bill", setProviderBillLinkFetcher, {
    onSuccess: () => {
      void invalidatePayments()
    },
  })
}
