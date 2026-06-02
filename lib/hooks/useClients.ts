import useSWR, { type KeyedMutator } from "swr"
import type { Client, PaginatedResponse } from "@/lib/domain/entities/client"
import { fetcher } from "@/lib/swr-fetcher"

export interface UseClientsArgs {
  search?: string
  page?: number
  pageSize?: number
}

export type ClientsKey = readonly ["/api/clients", string, number, number]

type ClientsResponse = PaginatedResponse<Client>

export interface UseClientsResult {
  data: ClientsResponse | undefined
  clients: Client[]
  total: number | undefined
  isLoading: boolean
  error: unknown
  mutate: KeyedMutator<ClientsResponse>
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10

export function buildClientsKey(args: UseClientsArgs): ClientsKey {
  return [
    "/api/clients",
    args.search ?? "",
    args.page ?? DEFAULT_PAGE,
    args.pageSize ?? DEFAULT_PAGE_SIZE,
  ] as const
}

export function buildClientsUrl(args: UseClientsArgs): string {
  const params = new URLSearchParams()
  const search = args.search ?? ""
  if (search.length > 0) {
    params.set("search", search)
  }
  params.set("page", String(args.page ?? DEFAULT_PAGE))
  params.set("pageSize", String(args.pageSize ?? DEFAULT_PAGE_SIZE))
  return `/api/clients?${params.toString()}`
}

export function isClientsKey(key: unknown): boolean {
  return Array.isArray(key) && key[0] === "/api/clients"
}

export function useClients(args: UseClientsArgs): UseClientsResult {
  const { data, error, isLoading, mutate } = useSWR<ClientsResponse>(
    buildClientsKey(args),
    () => fetcher<ClientsResponse>(buildClientsUrl(args)),
    { keepPreviousData: true }
  )

  return {
    data,
    clients: data?.items ?? [],
    total: data?.pagination.total,
    isLoading,
    error,
    mutate,
  }
}
