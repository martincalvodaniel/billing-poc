import { describe, expect, it } from "bun:test"
import { stepValue } from "./numberStepperInput-utils"

describe("stepValue", () => {
  it("increments by step", () => {
    expect(stepValue("5", 1, undefined, undefined, "increment")).toBe("6")
  })

  it("decrements by step", () => {
    expect(stepValue("5", 1, undefined, undefined, "decrement")).toBe("4")
  })

  it("supports decimal steps", () => {
    expect(stepValue("1.5", 0.25, undefined, undefined, "increment")).toBe(
      "1.75"
    )
  })

  it("clamps to max on increment", () => {
    expect(stepValue("9", 5, 0, 10, "increment")).toBe("10")
  })

  it("clamps to min on decrement", () => {
    expect(stepValue("2", 5, 0, 10, "decrement")).toBe("0")
  })

  it("uses min when current is empty", () => {
    expect(stepValue("", 1, 3, 10, "increment")).toBe("4")
  })

  it("uses a configured empty base before min", () => {
    expect(stepValue("", 0.1, -100, 100, "increment", 0)).toBe("0.1")
  })

  it("uses 0 when current is empty and no min", () => {
    expect(stepValue("", 1, undefined, undefined, "increment")).toBe("1")
  })

  it("treats NaN-like input as min or 0", () => {
    expect(stepValue("abc", 1, 5, undefined, "increment")).toBe("6")
    expect(stepValue("abc", 2, undefined, undefined, "increment")).toBe("2")
  })

  it("does not exceed max even when current already above max", () => {
    expect(stepValue("100", 1, 0, 10, "increment")).toBe("10")
  })

  it("does not go below min even when current already below min", () => {
    expect(stepValue("-5", 1, 0, 10, "decrement")).toBe("0")
  })
})
