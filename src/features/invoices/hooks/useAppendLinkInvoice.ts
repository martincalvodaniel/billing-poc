"use client"

import { useSWRConfig } from "swr"
import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { FetchError } from "@/lib/client/swr-fetcher"
import {
  getPaymentInvoices,
  type InvoiceMetadata,
} from "@/lib/domain/entities/payment"
import { updateInvoicePaymentCaches } from "./invoice-payment-cache"

export type AppendLinkInvoiceType = "Invoice" | "Receipt"

export interface AppendLinkInvoiceInput {
  type: AppendLinkInvoiceType
  link: string
}

export interface AppendLinkInvoiceResult {
  ok: true
  invoice: InvoiceMetadata
}

export function buildAppendLinkInvoiceUrl(paymentId: string): string {
  return `/api/payments/${encodeURIComponent(paymentId)}/invoices/link`
}

export function buildAppendLinkInvoiceBody({
  type,
  link,
}: AppendLinkInvoiceInput): AppendLinkInvoiceInput {
  return { type, link }
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

export async function appendLinkInvoiceFetcher(
  url: string,
  { arg }: { arg: AppendLinkInvoiceInput }
): Promise<AppendLinkInvoiceResult> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildAppendLinkInvoiceBody(arg)),
  })
  if (!response.ok) {
    await parseError(response, "Failed to append link invoice")
  }
  const result = (await response.json()) as Pick<AppendLinkInvoiceResult, "ok">
  return {
    ...result,
    invoice: {
      type: arg.type,
      link: arg.link,
      generatedAt: new Date(),
    },
  }
}

export type UseAppendLinkInvoiceResult = SWRMutationResponse<
  AppendLinkInvoiceResult,
  Error,
  string,
  AppendLinkInvoiceInput
>

export function useAppendLinkInvoice(
  paymentId: string
): UseAppendLinkInvoiceResult {
  const { mutate } = useSWRConfig()

  return useSWRMutation<
    AppendLinkInvoiceResult,
    Error,
    string,
    AppendLinkInvoiceInput
  >(buildAppendLinkInvoiceUrl(paymentId), appendLinkInvoiceFetcher, {
    onSuccess: (result) => {
      void updateInvoicePaymentCaches(mutate, paymentId, (payment) => ({
        ...payment,
        invoice: undefined,
        invoices: [...getPaymentInvoices(payment), result.invoice],
        updatedAt: new Date(),
      }))
    },
  })
}
