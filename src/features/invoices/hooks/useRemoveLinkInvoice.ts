"use client"

import { useSWRConfig } from "swr"
import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { FetchError } from "@/lib/client/swr-fetcher"
import { isPaymentHidden } from "@/lib/domain/entities/payment"
import { updateInvoicePaymentCaches } from "./invoice-payment-cache"

export interface RemoveLinkInvoiceInput {
  link: string
}

export interface RemoveLinkInvoiceResult {
  ok: true
  link: string
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
  const result = (await response.json()) as Pick<RemoveLinkInvoiceResult, "ok">
  return { ...result, link: arg.link }
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
  const { mutate } = useSWRConfig()

  return useSWRMutation<
    RemoveLinkInvoiceResult,
    Error,
    string,
    RemoveLinkInvoiceInput
  >(buildRemoveLinkInvoiceUrl(paymentId), removeLinkInvoiceFetcher, {
    onSuccess: (result) => {
      void updateInvoicePaymentCaches(mutate, paymentId, (payment) => {
        const invoices = (payment.invoices ?? []).filter(
          (invoice) => !(invoice.link === result.link && !invoice.id)
        )
        return {
          ...payment,
          hidden: isPaymentHidden({
            type: payment.type,
            invoice: payment.invoice,
            invoices,
          }),
          invoices,
          updatedAt: new Date(),
        }
      })
    },
  })
}
