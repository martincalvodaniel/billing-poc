import { describe, expect, test } from "bun:test"
import {
  buildAddAttendeeRequest,
  buildCreateEventRequest,
  buildDeleteEventRequest,
  buildGenerateEventPaymentRequest,
  buildGenerateEventPaymentsRequest,
  buildRemoveAttendeeRequest,
  buildUpdateAttendeeRequest,
  buildUpdateEventRequest,
} from "./useEventMutations"

describe("buildCreateEventRequest", () => {
  test("POSTs to /api/events with JSON body", () => {
    const req = buildCreateEventRequest({
      title: "Workshop",
      netAmount: 10,
      vatAmount: 2,
    })
    expect(req.url).toBe("/api/events")
    expect(req.method).toBe("POST")
    expect(req.body).toBe(
      JSON.stringify({ title: "Workshop", netAmount: 10, vatAmount: 2 })
    )
  })
})

describe("buildUpdateEventRequest", () => {
  test("PUTs to /api/events with id and patch fields", () => {
    const req = buildUpdateEventRequest({ id: "abc", title: "New title" })
    expect(req.url).toBe("/api/events")
    expect(req.method).toBe("PUT")
    expect(req.body).toBe(JSON.stringify({ id: "abc", title: "New title" }))
  })
})

describe("buildDeleteEventRequest", () => {
  test("DELETEs /api/events with id in body", () => {
    const req = buildDeleteEventRequest({ id: "abc" })
    expect(req.url).toBe("/api/events")
    expect(req.method).toBe("DELETE")
    expect(req.body).toBe(JSON.stringify({ id: "abc" }))
  })
})

describe("buildAddAttendeeRequest", () => {
  test("POSTs to /api/events/{eventId}/attendees with clientId+seats", () => {
    const req = buildAddAttendeeRequest({
      eventId: "ev1",
      clientId: "cli1",
      seats: 2,
    })
    expect(req.url).toBe("/api/events/ev1/attendees")
    expect(req.method).toBe("POST")
    expect(req.body).toBe(JSON.stringify({ clientId: "cli1", seats: 2 }))
  })

  test("URL-encodes ids with reserved characters", () => {
    const req = buildAddAttendeeRequest({
      eventId: "a/b",
      clientId: "c d",
      seats: 1,
    })
    expect(req.url).toBe("/api/events/a%2Fb/attendees")
  })
})

describe("buildUpdateAttendeeRequest", () => {
  test("PUTs to /api/events/{eventId}/attendees/{clientId} with seats", () => {
    const req = buildUpdateAttendeeRequest({
      eventId: "ev1",
      clientId: "cli1",
      seats: 5,
    })
    expect(req.url).toBe("/api/events/ev1/attendees/cli1")
    expect(req.method).toBe("PUT")
    expect(req.body).toBe(JSON.stringify({ seats: 5 }))
  })

  test("supports omitting seats (validator enforces 'at least one field')", () => {
    const req = buildUpdateAttendeeRequest({ eventId: "ev1", clientId: "cli1" })
    expect(req.body).toBe(JSON.stringify({}))
  })
})

describe("buildRemoveAttendeeRequest", () => {
  test("DELETEs /api/events/{eventId}/attendees/{clientId} with no body", () => {
    const req = buildRemoveAttendeeRequest({
      eventId: "ev1",
      clientId: "cli1",
    })
    expect(req.url).toBe("/api/events/ev1/attendees/cli1")
    expect(req.method).toBe("DELETE")
    expect(req.body).toBeUndefined()
  })
})

describe("buildGenerateEventPaymentRequest", () => {
  test("POSTs to the single-attendee payment endpoint with no body", () => {
    const req = buildGenerateEventPaymentRequest({
      eventId: "ev1",
      clientId: "cli1",
    })
    expect(req.url).toBe("/api/events/ev1/attendees/cli1/payment")
    expect(req.method).toBe("POST")
    expect(req.body).toBeUndefined()
  })
})

describe("buildGenerateEventPaymentsRequest", () => {
  test("POSTs to the bulk-payments endpoint with no body", () => {
    const req = buildGenerateEventPaymentsRequest({ eventId: "ev1" })
    expect(req.url).toBe("/api/events/ev1/payments")
    expect(req.method).toBe("POST")
    expect(req.body).toBeUndefined()
  })
})
