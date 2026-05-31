"use client"

import { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"
import {
  buildAddAttendeeRequest,
  buildCreateEventRequest,
  buildDeleteEventRequest,
  buildGenerateEventPaymentRequest,
  buildGenerateEventPaymentsRequest,
  buildRemoveAttendeeRequest,
  buildUpdateAttendeeRequest,
  buildUpdateEventRequest,
} from "./useEventMutations-requests"
import { runRequest } from "./useEventMutations-runtime"
import type {
  AddEventAttendeeInput,
  AddEventAttendeeResponse,
  BuiltRequest,
  CreateEventInput,
  CreateEventResponse,
  DeleteEventInput,
  DeleteEventResponse,
  GenerateEventPaymentInput,
  GenerateEventPaymentResponse,
  GenerateEventPaymentsInput,
  GenerateEventPaymentsResponse,
  RemoveEventAttendeeInput,
  RemoveEventAttendeeResponse,
  UpdateEventAttendeeInput,
  UpdateEventAttendeeResponse,
  UpdateEventInput,
  UpdateEventResponse,
} from "./useEventMutations-types"
import { isEventsKey } from "./useEvents"
import { isPaymentsKey } from "./usePayments"

export {
  buildAddAttendeeRequest,
  buildCreateEventRequest,
  buildDeleteEventRequest,
  buildGenerateEventPaymentRequest,
  buildGenerateEventPaymentsRequest,
  buildRemoveAttendeeRequest,
  buildUpdateAttendeeRequest,
  buildUpdateEventRequest,
} from "./useEventMutations-requests"
export { isInvoiceGuardError } from "./useEventMutations-runtime"
// Re-export types, request builders, and the invoice-guard helper so existing
// consumers/tests can keep importing them from this module.
export type * from "./useEventMutations-types"

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
  const invalidateEvents = useInvalidateEvents()
  const invalidatePayments = useInvalidatePayments()
  return useEventMutation<UpdateEventInput, UpdateEventResponse>(
    buildUpdateEventRequest,
    async () => {
      await invalidateEvents()
      await invalidatePayments()
    }
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
