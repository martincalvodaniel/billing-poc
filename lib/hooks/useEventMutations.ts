"use client"

import { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"
import { FetchError } from "../swr-fetcher"
import { isEventsKey } from "./useEvents"
import { isPaymentsKey } from "./usePayments"

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateEventInput {
  title: string
  description?: string
  year?: number
  month?: number
  day?: number
  hour?: number
  minute?: number
  durationMinutes?: number
  maxAttendees?: number
  netAmount: number
  vatAmount: number
}

export interface UpdateEventInput {
  id: string
  title?: string
  description?: string
  year?: number
  month?: number
  day?: number
  hour?: number
  minute?: number
  durationMinutes?: number
  maxAttendees?: number
  netAmount?: number
  vatAmount?: number
}

export interface DeleteEventInput {
  id: string
}

export interface AddEventAttendeeInput {
  eventId: string
  clientId: string
  seats: number
}

export interface UpdateEventAttendeeInput {
  eventId: string
  clientId: string
  seats?: number
}

export interface RemoveEventAttendeeInput {
  eventId: string
  clientId: string
}

export interface GenerateEventPaymentInput {
  eventId: string
  clientId: string
}

export interface GenerateEventPaymentsInput {
  eventId: string
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface CreateEventResponse {
  success: boolean
  id: string
}

export interface UpdateEventResponse {
  success: boolean
}

export interface DeleteEventResponse {
  success: boolean
}

export interface AddEventAttendeeResponse {
  success: boolean
}

export interface UpdateEventAttendeeResponse {
  success: boolean
}

export interface RemoveEventAttendeeResponse {
  success: boolean
}

export interface GenerateEventPaymentResponse {
  success?: boolean
  paymentId: string
  alreadyExists?: boolean
}

export interface GenerateEventPaymentsResponse {
  created: string[]
  skipped: string[]
}

// ---------------------------------------------------------------------------
// Request builders (pure, exported for tests)
// ---------------------------------------------------------------------------

export interface BuiltRequest {
  url: string
  method: "POST" | "PUT" | "DELETE"
  body?: string
}

function jsonBody<T>(body: T): string {
  return JSON.stringify(body)
}

export function buildCreateEventRequest(input: CreateEventInput): BuiltRequest {
  return { url: "/api/events", method: "POST", body: jsonBody(input) }
}

export function buildUpdateEventRequest(input: UpdateEventInput): BuiltRequest {
  return { url: "/api/events", method: "PUT", body: jsonBody(input) }
}

export function buildDeleteEventRequest(input: DeleteEventInput): BuiltRequest {
  return { url: "/api/events", method: "DELETE", body: jsonBody(input) }
}

export function buildAddAttendeeRequest(
  input: AddEventAttendeeInput
): BuiltRequest {
  const { eventId, clientId, seats } = input
  return {
    url: `/api/events/${encodeURIComponent(eventId)}/attendees`,
    method: "POST",
    body: jsonBody({ clientId, seats }),
  }
}

export function buildUpdateAttendeeRequest(
  input: UpdateEventAttendeeInput
): BuiltRequest {
  const { eventId, clientId, seats } = input
  return {
    url: `/api/events/${encodeURIComponent(eventId)}/attendees/${encodeURIComponent(clientId)}`,
    method: "PUT",
    body: jsonBody({ seats }),
  }
}

export function buildRemoveAttendeeRequest(
  input: RemoveEventAttendeeInput
): BuiltRequest {
  const { eventId, clientId } = input
  return {
    url: `/api/events/${encodeURIComponent(eventId)}/attendees/${encodeURIComponent(clientId)}`,
    method: "DELETE",
  }
}

export function buildGenerateEventPaymentRequest(
  input: GenerateEventPaymentInput
): BuiltRequest {
  const { eventId, clientId } = input
  return {
    url: `/api/events/${encodeURIComponent(eventId)}/attendees/${encodeURIComponent(clientId)}/payment`,
    method: "POST",
  }
}

export function buildGenerateEventPaymentsRequest(
  input: GenerateEventPaymentsInput
): BuiltRequest {
  return {
    url: `/api/events/${encodeURIComponent(input.eventId)}/payments`,
    method: "POST",
  }
}

// ---------------------------------------------------------------------------
// Invoice-guard error detection
// ---------------------------------------------------------------------------

/**
 * Detects the 409 "cannot-modify-invoiced-payment" response from the
 * `PUT /api/events/[id]/attendees/[clientId]` endpoint and returns its
 * structured payload. Returns `null` for any other error shape.
 *
 * The server emits exactly:
 *   { error: "cannot-modify-invoiced-payment",
 *     paymentId: string,
 *     invoiceSeries: string,
 *     invoiceNumber: number }
 * with HTTP 409, wrapped here as `FetchError(status=409, info=<body>)`.
 */
export function isInvoiceGuardError(
  err: unknown
): { invoiceSeries: string; invoiceNumber: number; paymentId: string } | null {
  if (!(err instanceof FetchError)) return null
  if (err.status !== 409) return null
  const info = err.info
  if (!info || typeof info !== "object") return null
  const record = info as Record<string, unknown>
  if (record.error !== "cannot-modify-invoiced-payment") return null
  const { invoiceSeries, invoiceNumber, paymentId } = record
  if (typeof invoiceSeries !== "string") return null
  if (typeof invoiceNumber !== "number") return null
  if (typeof paymentId !== "string") return null
  return { invoiceSeries, invoiceNumber, paymentId }
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

async function runRequest<TResponse>(req: BuiltRequest): Promise<TResponse> {
  const init: RequestInit = {
    method: req.method,
    credentials: "same-origin",
    headers: req.body ? { "Content-Type": "application/json" } : undefined,
    body: req.body,
  }
  const response = await fetch(req.url, init)
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
      `${req.method} ${req.url} failed with status ${response.status}`,
      response.status,
      info
    )
  }
  return (await response.json()) as TResponse
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

interface MutationResult<TInput, TResponse> {
  trigger: (input: TInput) => Promise<TResponse>
  isMutating: boolean
  error: unknown
  data: TResponse | undefined
  reset: () => void
}

function useInvalidateEvents() {
  const { mutate } = useSWRConfig()
  return () => mutate(isEventsKey, undefined, { revalidate: true })
}

function useInvalidatePayments() {
  const { mutate } = useSWRConfig()
  return () => mutate(isPaymentsKey, undefined, { revalidate: true })
}

const EVENTS_KEY = "/api/events"

function useEventMutation<TInput, TResponse>(
  build: (input: TInput) => BuiltRequest,
  onAfterSuccess: () => Promise<unknown>
): MutationResult<TInput, TResponse> {
  const { trigger, isMutating, error, data, reset } = useSWRMutation<
    TResponse,
    Error,
    typeof EVENTS_KEY,
    TInput
  >(EVENTS_KEY, (_url, { arg }) => runRequest<TResponse>(build(arg)))

  // The generic `trigger` signature widens to a union when wrapped in a
  // generic helper; cast preserves the same call shape used in the
  // non-generic hook files (e.g., usePaymentMutations.ts).
  const triggerFn = trigger as unknown as (input: TInput) => Promise<TResponse>

  const wrappedTrigger = async (input: TInput): Promise<TResponse> => {
    const result = await triggerFn(input)
    await onAfterSuccess()
    return result
  }

  return { trigger: wrappedTrigger, isMutating, error, data, reset }
}

export function useCreateEvent(): MutationResult<
  CreateEventInput,
  CreateEventResponse
> {
  const invalidate = useInvalidateEvents()
  return useEventMutation<CreateEventInput, CreateEventResponse>(
    buildCreateEventRequest,
    invalidate
  )
}

export function useUpdateEvent(): MutationResult<
  UpdateEventInput,
  UpdateEventResponse
> {
  const invalidate = useInvalidateEvents()
  return useEventMutation<UpdateEventInput, UpdateEventResponse>(
    buildUpdateEventRequest,
    invalidate
  )
}

export function useDeleteEvent(): MutationResult<
  DeleteEventInput,
  DeleteEventResponse
> {
  const invalidate = useInvalidateEvents()
  return useEventMutation<DeleteEventInput, DeleteEventResponse>(
    buildDeleteEventRequest,
    invalidate
  )
}

export function useAddEventAttendee(): MutationResult<
  AddEventAttendeeInput,
  AddEventAttendeeResponse
> {
  const invalidate = useInvalidateEvents()
  return useEventMutation<AddEventAttendeeInput, AddEventAttendeeResponse>(
    buildAddAttendeeRequest,
    invalidate
  )
}

export function useUpdateEventAttendee(): MutationResult<
  UpdateEventAttendeeInput,
  UpdateEventAttendeeResponse
> {
  const invalidate = useInvalidateEvents()
  return useEventMutation<
    UpdateEventAttendeeInput,
    UpdateEventAttendeeResponse
  >(buildUpdateAttendeeRequest, invalidate)
}

export function useRemoveEventAttendee(): MutationResult<
  RemoveEventAttendeeInput,
  RemoveEventAttendeeResponse
> {
  const invalidate = useInvalidateEvents()
  return useEventMutation<
    RemoveEventAttendeeInput,
    RemoveEventAttendeeResponse
  >(buildRemoveAttendeeRequest, invalidate)
}

export function useGenerateEventPayment(): MutationResult<
  GenerateEventPaymentInput,
  GenerateEventPaymentResponse
> {
  const invalidateEvents = useInvalidateEvents()
  const invalidatePayments = useInvalidatePayments()
  return useEventMutation<
    GenerateEventPaymentInput,
    GenerateEventPaymentResponse
  >(buildGenerateEventPaymentRequest, async () => {
    await Promise.all([invalidateEvents(), invalidatePayments()])
  })
}

export function useGenerateEventPayments(): MutationResult<
  GenerateEventPaymentsInput,
  GenerateEventPaymentsResponse
> {
  const invalidateEvents = useInvalidateEvents()
  const invalidatePayments = useInvalidatePayments()
  return useEventMutation<
    GenerateEventPaymentsInput,
    GenerateEventPaymentsResponse
  >(buildGenerateEventPaymentsRequest, async () => {
    await Promise.all([invalidateEvents(), invalidatePayments()])
  })
}
