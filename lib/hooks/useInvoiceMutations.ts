import { mutate } from "swr"
import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { isPaymentsKey } from "@/lib/hooks/usePayments"
import { FetchError } from "@/lib/swr-fetcher"
import type { InvoiceMetadata, InvoiceType, Payment } from "@/lib/types"

async function invalidatePayments(): Promise<void> {
  await mutate(isPaymentsKey, undefined, { revalidate: true })
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

// ---------- Generate invoice ----------

export interface GenerateInvoiceInput {
  paymentId: string
  type: InvoiceType
  persist?: boolean
}

export interface GenerateInvoiceResult {
  success: boolean
  invoice: Payment["invoice"]
  invoices: InvoiceMetadata[]
  id: string
  type: InvoiceType
  downloadUrl: string
}

export function buildGenerateInvoiceBody(input: GenerateInvoiceInput): {
  paymentId: string
  type: InvoiceType
  persist?: boolean
} {
  return {
    paymentId: input.paymentId,
    type: input.type,
    ...(input.persist !== undefined ? { persist: input.persist } : {}),
  }
}

/**
 * Build the per-invoice download URL handled by
 * `app/api/invoices/[paymentId]/[invoiceId]/route.ts`.
 */
export function buildOpenInvoiceUrl(
  paymentId: string,
  invoiceId: string
): string {
  return `/api/invoices/${encodeURIComponent(paymentId)}/${encodeURIComponent(invoiceId)}`
}

async function generateInvoiceFetcher(
  url: string,
  { arg }: { arg: GenerateInvoiceInput }
): Promise<GenerateInvoiceResult> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildGenerateInvoiceBody(arg)),
  })
  if (!response.ok) {
    await parseError(response, "Failed to generate invoice")
  }
  return (await response.json()) as GenerateInvoiceResult
}

export type UseGenerateInvoiceResult = SWRMutationResponse<
  GenerateInvoiceResult,
  Error,
  "/api/invoices/generate",
  GenerateInvoiceInput
>

export function useGenerateInvoice(): UseGenerateInvoiceResult {
  return useSWRMutation<
    GenerateInvoiceResult,
    Error,
    "/api/invoices/generate",
    GenerateInvoiceInput
  >("/api/invoices/generate", generateInvoiceFetcher, {
    onSuccess: () => {
      void invalidatePayments()
    },
  })
}
