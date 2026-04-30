"use client"

import { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"
import { FetchError } from "../swr-fetcher"
import type { PaymentConcept, PaymentType } from "../types"
import { isPaymentsKey } from "./usePayments"

export interface CreatePaymentInput {
  type: PaymentType
  date: string
  concepts: PaymentConcept[]
  vat: number | string
  surcharge?: number | string
  tag?: string
  clientId?: string
  deliveryNoteRef?: string
}

export interface UpdatePaymentInput {
  id: string
  type?: PaymentType
  date?: string
  concepts?: PaymentConcept[]
  vat?: number
  surcharge?: number
  tag?: string
  clientId?: string
  deliveryNoteRef?: string
  total?: number
}

export interface DeletePaymentInput {
  id: string
}

export interface CreatePaymentResponse {
  success: boolean
  id: string
}

export interface UpdatePaymentResponse {
  success: boolean
  total?: number
  vatAmount?: number
  surchargeAmount?: number
  netAmount?: number
  vat?: number
  surcharge?: number
}

export interface DeletePaymentResponse {
  success: boolean
}

const PAYMENTS_URL = "/api/payments"

/**
 * Build a `fetch` Request init for `/api/payments` mutations. Exported so
 * unit tests can verify the wire format without a real network call.
 */
export function buildPaymentsRequest<TBody>(
  method: "POST" | "PUT" | "DELETE",
  body: TBody
): { url: string; init: RequestInit } {
  return {
    url: PAYMENTS_URL,
    init: {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    },
  }
}

async function paymentsMutationFetcher<TBody, TResponse>(
  method: "POST" | "PUT" | "DELETE",
  body: TBody
): Promise<TResponse> {
  const { url, init } = buildPaymentsRequest(method, body)
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
      `${method} ${url} failed with status ${response.status}`,
      response.status,
      info
    )
  }

  return (await response.json()) as TResponse
}

interface MutationResult<TInput, TResponse> {
  trigger: (input: TInput) => Promise<TResponse>
  isMutating: boolean
  error: unknown
  data: TResponse | undefined
  reset: () => void
}

function useInvalidatePayments() {
  const { mutate } = useSWRConfig()
  return () => mutate(isPaymentsKey, undefined, { revalidate: true })
}

export function useCreatePayment(): MutationResult<
  CreatePaymentInput,
  CreatePaymentResponse
> {
  const invalidate = useInvalidatePayments()
  const { trigger, isMutating, error, data, reset } = useSWRMutation<
    CreatePaymentResponse,
    Error,
    typeof PAYMENTS_URL,
    CreatePaymentInput
  >(PAYMENTS_URL, (_url, { arg }) =>
    paymentsMutationFetcher<CreatePaymentInput, CreatePaymentResponse>(
      "POST",
      arg
    )
  )

  const wrappedTrigger = async (
    input: CreatePaymentInput
  ): Promise<CreatePaymentResponse> => {
    const result = await trigger(input)
    await invalidate()
    return result
  }

  return { trigger: wrappedTrigger, isMutating, error, data, reset }
}

export function useUpdatePayment(): MutationResult<
  UpdatePaymentInput,
  UpdatePaymentResponse
> {
  const invalidate = useInvalidatePayments()
  const { trigger, isMutating, error, data, reset } = useSWRMutation<
    UpdatePaymentResponse,
    Error,
    typeof PAYMENTS_URL,
    UpdatePaymentInput
  >(PAYMENTS_URL, (_url, { arg }) =>
    paymentsMutationFetcher<UpdatePaymentInput, UpdatePaymentResponse>(
      "PUT",
      arg
    )
  )

  const wrappedTrigger = async (
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentResponse> => {
    const result = await trigger(input)
    await invalidate()
    return result
  }

  return { trigger: wrappedTrigger, isMutating, error, data, reset }
}

export function useDeletePayment(): MutationResult<
  DeletePaymentInput,
  DeletePaymentResponse
> {
  const invalidate = useInvalidatePayments()
  const { trigger, isMutating, error, data, reset } = useSWRMutation<
    DeletePaymentResponse,
    Error,
    typeof PAYMENTS_URL,
    DeletePaymentInput
  >(PAYMENTS_URL, (_url, { arg }) =>
    paymentsMutationFetcher<DeletePaymentInput, DeletePaymentResponse>(
      "DELETE",
      arg
    )
  )

  const wrappedTrigger = async (
    input: DeletePaymentInput
  ): Promise<DeletePaymentResponse> => {
    const result = await trigger(input)
    await invalidate()
    return result
  }

  return { trigger: wrappedTrigger, isMutating, error, data, reset }
}
