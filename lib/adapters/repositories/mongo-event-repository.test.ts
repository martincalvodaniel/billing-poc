import { beforeAll, describe, expect, test } from "bun:test"

process.env.MONGODB_URI ??= "mongodb://localhost:27017/test"

type BuildEventListQuery =
  typeof import("./mongo-event-repository")["buildEventListQuery"]

let buildEventListQuery: BuildEventListQuery

beforeAll(async () => {
  ;({ buildEventListQuery } = await import("./mongo-event-repository"))
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
