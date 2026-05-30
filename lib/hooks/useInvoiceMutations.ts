import { mutate } from "swr"
import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { isPaymentsKey } from "@/lib/hooks/usePayments"
import { FetchError } from "@/lib/swr-fetcher"
import type { InvoiceMetadata, InvoiceSeries, Payment } from "@/lib/types"

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
  series: InvoiceSeries
}

export interface GenerateInvoiceResult {
  success: boolean
  invoice: Payment["invoice"]
  invoices: InvoiceMetadata[]
  downloadUrl: string
}

export function buildGenerateInvoiceBody(input: GenerateInvoiceInput): {
  paymentId: string
  series: InvoiceSeries
} {
  return { paymentId: input.paymentId, series: input.series }
}

/**
 * Build the precise per-invoice download URL handled by
 * `app/api/invoices/[id]/[series]/[number]/route.ts`.
 */
export function buildOpenInvoiceUrl(
  paymentId: string,
  series: InvoiceSeries,
  number: number
): string {
  return `/api/invoices/${encodeURIComponent(paymentId)}/${encodeURIComponent(series)}/${encodeURIComponent(String(number))}`
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

// ---------- Upload provider bill ----------

export interface UploadInvoiceInput {
  paymentId: string
  file: File
}

export interface UploadInvoiceResult {
  success: boolean
  billUrl: string
  pathname: string
}

export function buildUploadInvoiceFormData(
  input: UploadInvoiceInput
): FormData {
  const formData = new FormData()
  formData.append("file", input.file)
  formData.append("paymentId", input.paymentId)
  return formData
}

async function uploadInvoiceFetcher(
  url: string,
  { arg }: { arg: UploadInvoiceInput }
): Promise<UploadInvoiceResult> {
  // IMPORTANT: do NOT set Content-Type — the browser must set the multipart
  // boundary itself when given a FormData body.
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    body: buildUploadInvoiceFormData(arg),
  })
  if (!response.ok) {
    await parseError(response, "Failed to upload provider bill")
  }
  return (await response.json()) as UploadInvoiceResult
}

export type UseUploadInvoiceResult = SWRMutationResponse<
  UploadInvoiceResult,
  Error,
  "/api/invoices/upload",
  UploadInvoiceInput
>

export function useUploadInvoice(): UseUploadInvoiceResult {
  return useSWRMutation<
    UploadInvoiceResult,
    Error,
    "/api/invoices/upload",
    UploadInvoiceInput
  >("/api/invoices/upload", uploadInvoiceFetcher, {
    onSuccess: () => {
      void invalidatePayments()
    },
  })
}
