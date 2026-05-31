import { useSWRConfig } from "swr"
import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import type { ClientFormData } from "@/lib/domain/entities/client"
import { FetchError } from "@/lib/swr-fetcher"
import { isClientsKey } from "./useClients"

export const CLIENTS_ENDPOINT = "/api/clients"

export type CreateClientInput = ClientFormData

export interface UpdateClientInput extends Partial<ClientFormData> {
  id: string
}

export interface DeleteClientInput {
  id: string
}

export interface CreateClientResponse {
  success: true
  id: string
}

export interface MutationResponse {
  success: true
}

export function buildJsonRequestInit<T>(method: string, body: T): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
}

async function sendJson<TBody, TResp>(
  url: string,
  method: string,
  body: TBody
): Promise<TResp> {
  const response = await fetch(url, {
    ...buildJsonRequestInit(method, body),
    credentials: "same-origin",
  })

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""
    let info: unknown = null
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
      `Request to ${url} failed with status ${response.status}`,
      response.status,
      info
    )
  }

  return (await response.json()) as TResp
}

export function useCreateClient(): SWRMutationResponse<
  CreateClientResponse,
  unknown,
  typeof CLIENTS_ENDPOINT,
  CreateClientInput
> {
  const { mutate } = useSWRConfig()
  return useSWRMutation<
    CreateClientResponse,
    unknown,
    typeof CLIENTS_ENDPOINT,
    CreateClientInput
  >(
    CLIENTS_ENDPOINT,
    (url, { arg }) =>
      sendJson<CreateClientInput, CreateClientResponse>(url, "POST", arg),
    {
      onSuccess: () => {
        mutate(isClientsKey, undefined, { revalidate: true })
      },
    }
  )
}

export function useUpdateClient(): SWRMutationResponse<
  MutationResponse,
  unknown,
  typeof CLIENTS_ENDPOINT,
  UpdateClientInput
> {
  const { mutate } = useSWRConfig()
  return useSWRMutation<
    MutationResponse,
    unknown,
    typeof CLIENTS_ENDPOINT,
    UpdateClientInput
  >(
    CLIENTS_ENDPOINT,
    (url, { arg }) =>
      sendJson<UpdateClientInput, MutationResponse>(url, "PUT", arg),
    {
      onSuccess: () => {
        mutate(isClientsKey, undefined, { revalidate: true })
      },
    }
  )
}

export function useDeleteClient(): SWRMutationResponse<
  MutationResponse,
  unknown,
  typeof CLIENTS_ENDPOINT,
  DeleteClientInput
> {
  const { mutate } = useSWRConfig()
  return useSWRMutation<
    MutationResponse,
    unknown,
    typeof CLIENTS_ENDPOINT,
    DeleteClientInput
  >(
    CLIENTS_ENDPOINT,
    (url, { arg }) =>
      sendJson<DeleteClientInput, MutationResponse>(url, "DELETE", arg),
    {
      onSuccess: () => {
        mutate(isClientsKey, undefined, { revalidate: true })
      },
    }
  )
}

export { isClientsKey }
