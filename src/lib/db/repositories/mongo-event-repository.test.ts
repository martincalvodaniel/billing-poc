import { beforeAll, describe, expect, mock, test } from "bun:test"
import { ObjectId } from "mongodb"

mock.module("server-only", () => ({}))

process.env.MONGODB_URI ??= "mongodb://localhost:27017/test"

type BuildEventListQuery =
  typeof import("./mongo-event-repository")["buildEventListQuery"]
type MongoEventRepositoryHelpers =
  typeof import("./mongo-event-repository-helpers")

let buildEventListQuery: BuildEventListQuery
let attendeeToMongo: MongoEventRepositoryHelpers["attendeeToMongo"]

beforeAll(async () => {
  ;({ buildEventListQuery } = await import("./mongo-event-repository"))
  ;({ attendeeToMongo } = await import("./mongo-event-repository-helpers"))
})

describe("buildEventListQuery", () => {
  test("returns empty query when no filter is provided", () => {
    expect(buildEventListQuery({})).toEqual({})
  })

  test("year-only filter matches date range OR null date", () => {
    expect(buildEventListQuery({ year: 2026 })).toEqual({
      $or: [
        { date: { $gte: "2026-01-01", $lte: "2026-12-31" } },
        { year: 2026, date: null },
      ],
    })
  })

  test("year+month filter matches month range OR null day", () => {
    expect(buildEventListQuery({ year: 2026, month: 5 })).toEqual({
      $or: [
        { date: { $gte: "2026-05-01", $lte: "2026-05-31" } },
        { year: 2026, month: 5, day: null },
      ],
    })
  })

  test("year+month filter handles February leap year (29 days)", () => {
    expect(buildEventListQuery({ year: 2024, month: 2 })).toEqual({
      $or: [
        { date: { $gte: "2024-02-01", $lte: "2024-02-29" } },
        { year: 2024, month: 2, day: null },
      ],
    })
  })
})

describe("attendeeToMongo", () => {
  const clientId = new ObjectId().toString()
  const addedAt = new Date("2026-05-24T12:00:00Z")

  test("omits paymentId key when domain attendee has no paymentId", () => {
    const doc = attendeeToMongo({ clientId, seats: 2, addedAt })
    expect(Object.hasOwn(doc, "paymentId")).toBe(false)
    expect(doc.clientId).toBeInstanceOf(ObjectId)
    expect(doc.clientId.toString()).toBe(clientId)
    expect(doc.seats).toBe(2)
    expect(doc.addedAt).toBe(addedAt)
  })

  test("includes paymentId as ObjectId when present", () => {
    const paymentId = new ObjectId().toString()
    const doc = attendeeToMongo({ clientId, seats: 1, paymentId, addedAt })
    expect(Object.hasOwn(doc, "paymentId")).toBe(true)
    expect(doc.paymentId).toBeInstanceOf(ObjectId)
    expect(doc.paymentId?.toString()).toBe(paymentId)
  })

  test("omits paymentId key when explicitly undefined", () => {
    const doc = attendeeToMongo({
      clientId,
      seats: 1,
      paymentId: undefined,
      addedAt,
    })
    expect(Object.hasOwn(doc, "paymentId")).toBe(false)
  })
})
