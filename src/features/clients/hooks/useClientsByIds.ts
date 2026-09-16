"use client"

import useSWR, { type KeyedMutator } from "swr"
import { fetcher } from "@/lib/client/swr-fetcher"
import type { Client } from "@/lib/domain/entities/client"

const CLIENTS_BY_IDS_ENDPOINT = "/api/clients/by-ids"
export const CLIENT_IDS_PER_REQUEST = 50

export type ClientsByIdsKey = readonly ["/api/clients", "by-ids", string]

interface ClientsByIdsResponse {
  clients: Client[]
}

export interface UseClientsByIdsResult {
  clients: Client[]
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<ClientsByIdsResponse>
}

export function normalizeClientIds(ids: readonly string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))].sort()
}

export function buildClientsByIdsKey(
  ids: readonly string[]
): ClientsByIdsKey | null {
  const normalizedIds = normalizeClientIds(ids)
  return normalizedIds.length > 0
    ? (["/api/clients", "by-ids", JSON.stringify(normalizedIds)] as const)
    : null
}

export function buildClientsByIdsUrls(ids: readonly string[]): string[] {
  const normalizedIds = normalizeClientIds(ids)
  const urls: string[] = []

  for (
    let index = 0;
    index < normalizedIds.length;
    index += CLIENT_IDS_PER_REQUEST
  ) {
    const params = new URLSearchParams()
    for (const id of normalizedIds.slice(
      index,
      index + CLIENT_IDS_PER_REQUEST
    )) {
      params.append("id", id)
    }
    urls.push(`${CLIENTS_BY_IDS_ENDPOINT}?${params.toString()}`)
  }

  return urls
}

async function fetchClientsByIds(
  ids: readonly string[]
): Promise<ClientsByIdsResponse> {
  const responses = await Promise.all(
    buildClientsByIdsUrls(ids).map((url) => fetcher<ClientsByIdsResponse>(url))
  )
  return { clients: responses.flatMap((response) => response.clients) }
}

export function useClientsByIds(ids: readonly string[]): UseClientsByIdsResult {
  const key = buildClientsByIdsKey(ids)
  const { data, error, isLoading, mutate } = useSWR<ClientsByIdsResponse>(
    key,
    () => fetchClientsByIds(ids)
  )

  return {
    clients: data?.clients ?? [],
    isLoading,
    error,
    mutate,
  }
}
