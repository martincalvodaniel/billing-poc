"use client"

import { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"
import type { AbsenceType, PartOfDay } from "@/lib/domain/entities/absence"
import { FetchError } from "../swr-fetcher"
import { isAbsenceStudentsKey } from "./useAbsenceStudents"
import { isAbsenceSummaryKey } from "./useAbsenceSummary"
import { isAbsencesKey } from "./useAbsences"

export interface CreateAbsenceInput {
  type: AbsenceType
  studentName: string
  date: string
  partOfDay: PartOfDay
  comment?: string
}

export interface UpdateAbsenceInput {
  id: string
  type?: AbsenceType
  studentName?: string
  date?: string
  partOfDay?: PartOfDay
  comment?: string
}

export type DeleteAbsenceInput = { id: string } | { studentName: string }

export interface CreateAbsenceResponse {
  success: boolean
  id: string
}

export interface UpdateAbsenceResponse {
  success: boolean
}

export interface DeleteAbsenceResponse {
  success: boolean
  deletedCount: number
}

export function isConflictError(err: unknown): err is FetchError {
  return err instanceof FetchError && err.status === 409
}

const ABSENCES_URL = "/api/absences"

/**
 * Build a `fetch` Request init for `/api/absences` mutations. Exported so
 * unit tests can verify the wire format without a real network call.
 */
export function buildAbsencesRequest<TBody>(
  method: "POST" | "PUT" | "DELETE",
  body: TBody
): { url: string; init: RequestInit } {
  return {
    url: ABSENCES_URL,
    init: {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    },
  }
}

async function absencesMutationFetcher<TBody, TResponse>(
  method: "POST" | "PUT" | "DELETE",
  body: TBody
): Promise<TResponse> {
  const { url, init } = buildAbsencesRequest(method, body)
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

function useInvalidateAbsences() {
  const { mutate } = useSWRConfig()
  return async () => {
    await Promise.all([
      mutate(isAbsencesKey, undefined, { revalidate: true }),
      mutate(isAbsenceSummaryKey, undefined, { revalidate: true }),
      mutate(isAbsenceStudentsKey, undefined, { revalidate: true }),
    ])
  }
}

export function useCreateAbsence(): MutationResult<
  CreateAbsenceInput,
  CreateAbsenceResponse
> {
  const invalidate = useInvalidateAbsences()
  const { trigger, isMutating, error, data, reset } = useSWRMutation<
    CreateAbsenceResponse,
    Error,
    typeof ABSENCES_URL,
    CreateAbsenceInput
  >(ABSENCES_URL, (_url, { arg }) =>
    absencesMutationFetcher<CreateAbsenceInput, CreateAbsenceResponse>(
      "POST",
      arg
    )
  )

  const wrappedTrigger = async (
    input: CreateAbsenceInput
  ): Promise<CreateAbsenceResponse> => {
    const result = await trigger(input)
    await invalidate()
    return result
  }

  return { trigger: wrappedTrigger, isMutating, error, data, reset }
}

export function useUpdateAbsence(): MutationResult<
  UpdateAbsenceInput,
  UpdateAbsenceResponse
> {
  const invalidate = useInvalidateAbsences()
  const { trigger, isMutating, error, data, reset } = useSWRMutation<
    UpdateAbsenceResponse,
    Error,
    typeof ABSENCES_URL,
    UpdateAbsenceInput
  >(ABSENCES_URL, (_url, { arg }) =>
    absencesMutationFetcher<UpdateAbsenceInput, UpdateAbsenceResponse>(
      "PUT",
      arg
    )
  )

  const wrappedTrigger = async (
    input: UpdateAbsenceInput
  ): Promise<UpdateAbsenceResponse> => {
    const result = await trigger(input)
    await invalidate()
    return result
  }

  return { trigger: wrappedTrigger, isMutating, error, data, reset }
}

export function useDeleteAbsence(): MutationResult<
  DeleteAbsenceInput,
  DeleteAbsenceResponse
> {
  const invalidate = useInvalidateAbsences()
  const { trigger, isMutating, error, data, reset } = useSWRMutation<
    DeleteAbsenceResponse,
    Error,
    typeof ABSENCES_URL,
    DeleteAbsenceInput
  >(ABSENCES_URL, (_url, { arg }) =>
    absencesMutationFetcher<DeleteAbsenceInput, DeleteAbsenceResponse>(
      "DELETE",
      arg
    )
  )

  const wrappedTrigger = async (
    input: DeleteAbsenceInput
  ): Promise<DeleteAbsenceResponse> => {
    const result = await trigger(input)
    await invalidate()
    return result
  }

  return { trigger: wrappedTrigger, isMutating, error, data, reset }
}
