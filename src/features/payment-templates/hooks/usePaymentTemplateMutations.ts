"use client"

import { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"
import { FetchError } from "@/lib/client/swr-fetcher"
import type { PaymentFormData } from "@/lib/domain/entities/payment"
import { buildCreatePaymentTemplatePayload } from "../utils"
import { isPaymentTemplatesKey } from "./usePaymentTemplates"

export interface CreatePaymentTemplateInput {
  name: string
  formData: PaymentFormData
}

export interface CreatePaymentTemplateResponse {
  success: boolean
  id: string
}

const PAYMENT_TEMPLATES_URL = "/api/payment-templates"

export function buildPaymentTemplateRequest<TBody>(
  method: "POST",
  body: TBody
): { url: string; init: RequestInit } {
  return {
    url: PAYMENT_TEMPLATES_URL,
    init: {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    },
  }
}

async function paymentTemplateMutationFetcher<TBody, TResponse>(
  method: "POST",
  body: TBody
): Promise<TResponse> {
  const { url, init } = buildPaymentTemplateRequest(method, body)
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

function useInvalidatePaymentTemplates() {
  const { mutate } = useSWRConfig()
  return () => mutate(isPaymentTemplatesKey, undefined, { revalidate: true })
}

export function useCreatePaymentTemplate(): MutationResult<
  CreatePaymentTemplateInput,
  CreatePaymentTemplateResponse
> {
  const invalidate = useInvalidatePaymentTemplates()
  const { trigger, isMutating, error, data, reset } = useSWRMutation<
    CreatePaymentTemplateResponse,
    Error,
    typeof PAYMENT_TEMPLATES_URL,
    CreatePaymentTemplateInput
  >(PAYMENT_TEMPLATES_URL, (_url, { arg }) =>
    paymentTemplateMutationFetcher<
      {
        name: string
        type: PaymentFormData["type"]
        concepts: PaymentFormData["concepts"]
        vat: number
        surcharge?: number
        discount?: number
        tag?: string
        clientId?: string
        deliveryNoteRef?: string
        paymentMethod?: PaymentFormData["paymentMethod"]
      },
      CreatePaymentTemplateResponse
    >("POST", buildCreatePaymentTemplatePayload(arg.name, arg.formData))
  )

  const wrappedTrigger = async (
    input: CreatePaymentTemplateInput
  ): Promise<CreatePaymentTemplateResponse> => {
    const result = await trigger(input)
    await invalidate()
    return result
  }

  return { trigger: wrappedTrigger, isMutating, error, data, reset }
}
