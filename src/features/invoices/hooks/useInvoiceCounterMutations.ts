"use client"

import { useSWRConfig } from "swr"
import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import {
  isPaymentKey,
  isPaymentsKey,
} from "@/features/payments/hooks/usePayments"
import { FetchError } from "@/lib/client/swr-fetcher"
import type { NumberedInvoiceSeries } from "@/lib/domain/entities/invoice"
import {
  type GeneratedInvoiceSnapshot,
  isInvoiceCountersKey,
} from "./useInvoiceCounters"

export interface InvoiceCounterTargetInput {
  series: NumberedInvoiceSeries
  year: number
  newLastNumber: number
}

export interface ReduceInvoiceCounterInput extends InvoiceCounterTargetInput {
  expectedCurrentNumber: number
}

export interface InvoiceReductionPreviewSnapshot
  extends InvoiceCounterTargetInput {
  currentNumber: number
  invoices: GeneratedInvoiceSnapshot[]
  affectedPaymentCount: number
}

interface PreviewInvoiceCounterResult {
  preview: InvoiceReductionPreviewSnapshot
}

interface ReduceInvoiceCounterResult extends PreviewInvoiceCounterResult {
  success: true
}

export function buildInvoiceCounterTargetBody(
  input: InvoiceCounterTargetInput
): InvoiceCounterTargetInput {
  return {
    series: input.series,
    year: input.year,
    newLastNumber: input.newLastNumber,
  }
}

export function buildReduceInvoiceCounterBody(
  input: ReduceInvoiceCounterInput
): ReduceInvoiceCounterInput {
  return {
    ...buildInvoiceCounterTargetBody(input),
    expectedCurrentNumber: input.expectedCurrentNumber,
  }
}

async function parseError(
  response: Response,
  fallback: string
): Promise<never> {
  let info: unknown = null
  try {
    info = await response.json()
  } catch {
    info = null
  }
  const message =
    info && typeof info === "object" && "error" in info
      ? String((info as { error: unknown }).error)
      : fallback
  throw new FetchError(message, response.status, info)
}

export async function previewInvoiceCounterFetcher(
  url: string,
  { arg }: { arg: InvoiceCounterTargetInput }
): Promise<PreviewInvoiceCounterResult> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildInvoiceCounterTargetBody(arg)),
  })
  if (!response.ok) {
    await parseError(response, "Failed to preview invoice counter reduction")
  }
  return (await response.json()) as PreviewInvoiceCounterResult
}

export async function reduceInvoiceCounterFetcher(
  url: string,
  { arg }: { arg: ReduceInvoiceCounterInput }
): Promise<ReduceInvoiceCounterResult> {
  const response = await fetch(url, {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildReduceInvoiceCounterBody(arg)),
  })
  if (!response.ok) {
    await parseError(response, "Failed to reduce invoice counter")
  }
  return (await response.json()) as ReduceInvoiceCounterResult
}

export type UsePreviewInvoiceCounterResult = SWRMutationResponse<
  PreviewInvoiceCounterResult,
  Error,
  "/api/invoices/counters/preview",
  InvoiceCounterTargetInput
>

export function usePreviewInvoiceCounter(): UsePreviewInvoiceCounterResult {
  return useSWRMutation(
    "/api/invoices/counters/preview",
    previewInvoiceCounterFetcher
  )
}

export type UseReduceInvoiceCounterResult = SWRMutationResponse<
  ReduceInvoiceCounterResult,
  Error,
  "/api/invoices/counters",
  ReduceInvoiceCounterInput
>

export function useReduceInvoiceCounter(): UseReduceInvoiceCounterResult {
  const { mutate } = useSWRConfig()
  const revalidateInvoiceData = async () => {
    await Promise.all([
      mutate(isInvoiceCountersKey),
      mutate(isPaymentsKey),
      mutate(isPaymentKey),
    ])
  }
  return useSWRMutation("/api/invoices/counters", reduceInvoiceCounterFetcher, {
    onSuccess: revalidateInvoiceData,
    onError: revalidateInvoiceData,
  })
}
