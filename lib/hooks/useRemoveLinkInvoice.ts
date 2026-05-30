import { mutate } from "swr"
import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { isPaymentKey, isPaymentsKey } from "@/lib/hooks/usePayments"
import { FetchError } from "@/lib/swr-fetcher"

export interface RemoveLinkInvoiceInput {
  link: string
}

export interface RemoveLinkInvoiceResult {
  ok: true
}

export function buildRemoveLinkInvoiceUrl(paymentId: string): string {
  return `/api/payments/${encodeURIComponent(paymentId)}/invoices/link`
}

export function buildRemoveLinkInvoiceBody({
  link,
}: RemoveLinkInvoiceInput): RemoveLinkInvoiceInput {
  return { link }
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

export async function removeLinkInvoiceFetcher(
  url: string,
  { arg }: { arg: RemoveLinkInvoiceInput }
): Promise<RemoveLinkInvoiceResult> {
  const response = await fetch(url, {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildRemoveLinkInvoiceBody(arg)),
  })
  if (!response.ok) {
    await parseError(response, "Failed to remove link invoice")
  }
  return (await response.json()) as RemoveLinkInvoiceResult
}

async function invalidatePayments(): Promise<void> {
  await Promise.all([
    mutate(isPaymentsKey, undefined, { revalidate: true }),
    mutate(isPaymentKey, undefined, { revalidate: true }),
  ])
}

export type UseRemoveLinkInvoiceResult = SWRMutationResponse<
  RemoveLinkInvoiceResult,
  Error,
  string,
  RemoveLinkInvoiceInput
>

export function useRemoveLinkInvoice(
  paymentId: string
): UseRemoveLinkInvoiceResult {
  return useSWRMutation<
    RemoveLinkInvoiceResult,
    Error,
    string,
    RemoveLinkInvoiceInput
  >(buildRemoveLinkInvoiceUrl(paymentId), removeLinkInvoiceFetcher, {
    onSuccess: () => {
      void invalidatePayments()
    },
  })
}
