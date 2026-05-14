import { describe, expect, test } from "bun:test"
import { FetchError } from "../swr-fetcher"
import {
  buildAddAttendeeRequest,
  buildCreateEventRequest,
  buildDeleteEventRequest,
  buildGenerateEventPaymentRequest,
  buildGenerateEventPaymentsRequest,
  buildRemoveAttendeeRequest,
  buildUpdateAttendeeRequest,
  buildUpdateEventRequest,
  isInvoiceGuardError,
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

describe("isInvoiceGuardError", () => {
  test("returns payload for a matching FetchError", () => {
    const err = new FetchError("conflict", 409, {
      error: "cannot-modify-invoiced-payment",
      paymentId: "pay1",
      invoiceSeries: "Invoice",
      invoiceNumber: 42,
    })
    expect(isInvoiceGuardError(err)).toEqual({
      paymentId: "pay1",
      invoiceSeries: "Invoice",
      invoiceNumber: 42,
    })
  })

  test("returns null when error code is different", () => {
    const err = new FetchError("conflict", 409, {
      error: "some-other-error",
      paymentId: "pay1",
      invoiceSeries: "Invoice",
      invoiceNumber: 42,
    })
    expect(isInvoiceGuardError(err)).toBeNull()
  })

  test("returns null when status is not 409", () => {
    const err = new FetchError("bad", 400, {
      error: "cannot-modify-invoiced-payment",
      paymentId: "pay1",
      invoiceSeries: "Invoice",
      invoiceNumber: 42,
    })
    expect(isInvoiceGuardError(err)).toBeNull()
  })

  test("returns null when paymentId is missing", () => {
    const err = new FetchError("conflict", 409, {
      error: "cannot-modify-invoiced-payment",
      invoiceSeries: "Invoice",
      invoiceNumber: 42,
    })
    expect(isInvoiceGuardError(err)).toBeNull()
  })

  test("returns null when invoiceSeries is missing", () => {
    const err = new FetchError("conflict", 409, {
      error: "cannot-modify-invoiced-payment",
      paymentId: "pay1",
      invoiceNumber: 42,
    })
    expect(isInvoiceGuardError(err)).toBeNull()
  })

  test("returns null when invoiceNumber is not a number", () => {
    const err = new FetchError("conflict", 409, {
      error: "cannot-modify-invoiced-payment",
      paymentId: "pay1",
      invoiceSeries: "Invoice",
      invoiceNumber: "42",
    })
    expect(isInvoiceGuardError(err)).toBeNull()
  })

  test("returns null when info is null", () => {
    const err = new FetchError("conflict", 409, null)
    expect(isInvoiceGuardError(err)).toBeNull()
  })

  test("returns null when info is a string", () => {
    const err = new FetchError("conflict", 409, "not json")
    expect(isInvoiceGuardError(err)).toBeNull()
  })

  test("returns null for a non-FetchError", () => {
    expect(isInvoiceGuardError(new Error("boom"))).toBeNull()
  })

  test("returns null for unknown values", () => {
    expect(isInvoiceGuardError(null)).toBeNull()
    expect(isInvoiceGuardError(undefined)).toBeNull()
    expect(isInvoiceGuardError("nope")).toBeNull()
    expect(isInvoiceGuardError(42)).toBeNull()
  })
})
