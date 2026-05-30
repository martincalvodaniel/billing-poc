import { describe, expect, test } from "bun:test"
import type { Client } from "@/lib/domain/entities/client"
import type { EventAttendee } from "@/lib/domain/entities/event"
import { buildAttendeeEmailsString } from "./attendeesPanel-utils"

function client(id: string, email?: string): Client {
  return {
    _id: id,
    clientType: "individual",
    name: `Client ${id}`,
    email,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  }
}

function attendee(clientId: string): EventAttendee {
  return { clientId, seats: 1, addedAt: new Date(0) }
}

describe("buildAttendeeEmailsString", () => {
  test("returns empty string when attendees list is empty", () => {
    expect(buildAttendeeEmailsString([], [client("1", "a@x")])).toBe("")
  })

  test("joins all attendee emails with ', '", () => {
    const clients = [client("1", "a@x"), client("2", "b@x"), client("3", "c@x")]
    const attendees = [attendee("1"), attendee("2"), attendee("3")]
    expect(buildAttendeeEmailsString(attendees, clients)).toBe("a@x, b@x, c@x")
  })

  test("filters out clients without an email", () => {
    const clients = [client("1", "a@x"), client("2"), client("3", "c@x")]
    const attendees = [attendee("1"), attendee("2"), attendee("3")]
    expect(buildAttendeeEmailsString(attendees, clients)).toBe("a@x, c@x")
  })

  test("filters out attendees whose clients are missing", () => {
    const clients = [client("1", "a@x"), client("3", "c@x")]
    const attendees = [attendee("1"), attendee("2"), attendee("3")]
    expect(buildAttendeeEmailsString(attendees, clients)).toBe("a@x, c@x")
  })

  test("filters out whitespace-only emails", () => {
    const clients = [client("1", "a@x"), client("2", "   "), client("3", "c@x")]
    const attendees = [attendee("1"), attendee("2"), attendee("3")]
    expect(buildAttendeeEmailsString(attendees, clients)).toBe("a@x, c@x")
  })

  test("preserves attendee order regardless of clients order", () => {
    const clients = [client("3", "c@x"), client("1", "a@x"), client("2", "b@x")]
    const attendees = [attendee("2"), attendee("3"), attendee("1")]
    expect(buildAttendeeEmailsString(attendees, clients)).toBe("b@x, c@x, a@x")
  })

  test("returns empty string when no attendees have emails", () => {
    const clients = [client("1"), client("2", "  "), client("3")]
    const attendees = [attendee("1"), attendee("2"), attendee("3")]
    expect(buildAttendeeEmailsString(attendees, clients)).toBe("")
  })
})
