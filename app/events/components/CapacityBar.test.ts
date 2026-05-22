import { describe, expect, test } from "bun:test"
import { computeFillPercent, computeStatus } from "./capacityBar-utils"

describe("computeFillPercent", () => {
  test("returns 0 when max is undefined", () => {
    expect(computeFillPercent(3, undefined)).toBe(0)
  })

  test("returns 0 when max is 0 or negative", () => {
    expect(computeFillPercent(3, 0)).toBe(0)
    expect(computeFillPercent(3, -1)).toBe(0)
  })

  test("returns 0 when used is 0 or negative", () => {
    expect(computeFillPercent(0, 10)).toBe(0)
    expect(computeFillPercent(-2, 10)).toBe(0)
  })

  test("returns ratio × 100 when used < max", () => {
    expect(computeFillPercent(5, 10)).toBe(50)
    expect(computeFillPercent(2, 8)).toBe(25)
  })

  test("returns 100 when used equals max", () => {
    expect(computeFillPercent(10, 10)).toBe(100)
  })

  test("clamps to 100 when used exceeds max", () => {
    expect(computeFillPercent(15, 10)).toBe(100)
  })
})

describe("computeStatus", () => {
  test("returns 'unbounded' when max is undefined or non-positive", () => {
    expect(computeStatus(3, undefined)).toBe("unbounded")
    expect(computeStatus(3, 0)).toBe("unbounded")
    expect(computeStatus(3, -1)).toBe("unbounded")
  })

  test("returns 'ok' when used < max", () => {
    expect(computeStatus(5, 10)).toBe("ok")
    expect(computeStatus(0, 10)).toBe("ok")
  })

  test("returns 'full' when used equals max", () => {
    expect(computeStatus(10, 10)).toBe("full")
  })

  test("returns 'over' when used exceeds max", () => {
    expect(computeStatus(11, 10)).toBe("over")
  })
})
