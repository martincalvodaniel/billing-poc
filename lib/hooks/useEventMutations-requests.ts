import type {
  AddEventAttendeeInput,
  BuiltRequest,
  CreateEventInput,
  DeleteEventInput,
  GenerateEventPaymentInput,
  GenerateEventPaymentsInput,
  RemoveEventAttendeeInput,
  UpdateEventAttendeeInput,
  UpdateEventInput,
} from "./useEventMutations-types"

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
  const { eventId, clientId, paymentMethod } = input
  return {
    url: `/api/events/${encodeURIComponent(eventId)}/attendees/${encodeURIComponent(clientId)}/payment`,
    method: "POST",
    body: paymentMethod ? jsonBody({ paymentMethod }) : undefined,
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
