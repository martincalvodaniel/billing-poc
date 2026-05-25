import { describe, expect, it } from "bun:test"
import { MongoUpdateBuilder, omitNullish, setOrUnset } from "./mongo-utils"

describe("omitNullish", () => {
  it("returns an empty object for an empty input", () => {
    expect(omitNullish({})).toEqual({})
  })

  it("drops only null and undefined values", () => {
    const input = { a: 1, b: null, c: undefined, d: "x" }
    expect(omitNullish(input)).toEqual({ a: 1, d: "x" })
  })

  it("returns an empty object when every value is nullish", () => {
    expect(omitNullish({ a: null, b: undefined })).toEqual({})
  })

  it("preserves falsy non-nullish values (0, '', false)", () => {
    const input = { zero: 0, empty: "", flag: false, none: null }
    expect(omitNullish(input)).toEqual({ zero: 0, empty: "", flag: false })
  })

  it("does not recurse into nested objects", () => {
    const nested = { inner: null }
    const input = { nested, keep: 1, drop: undefined }
    const result = omitNullish(input)
    expect(result).toEqual({ nested, keep: 1 })
    expect(result.nested).toBe(nested)
  })

  it("does not mutate the input", () => {
    const input = { a: 1, b: null }
    const snapshot = { ...input }
    omitNullish(input)
    expect(input).toEqual(snapshot)
  })
})

describe("setOrUnset", () => {
  it("returns an unset op when value is undefined", () => {
    expect(setOrUnset("phone", undefined)).toEqual({
      unset: { phone: true },
    })
  })

  it("returns an unset op when value is null", () => {
    expect(setOrUnset("phone", null)).toEqual({ unset: { phone: true } })
  })

  it("returns a set op for defined primitive values", () => {
    expect(setOrUnset("phone", "+34 600 000 000")).toEqual({
      set: { phone: "+34 600 000 000" },
    })
  })

  it("treats 0 as a value to set, not unset", () => {
    expect(setOrUnset("discount", 0)).toEqual({ set: { discount: 0 } })
  })

  it("treats empty string as a value to set, not unset", () => {
    expect(setOrUnset("note", "")).toEqual({ set: { note: "" } })
  })

  it("treats false as a value to set, not unset", () => {
    expect(setOrUnset("active", false)).toEqual({ set: { active: false } })
  })
})

describe("MongoUpdateBuilder", () => {
  it("returns an empty object when nothing has been recorded", () => {
    expect(new MongoUpdateBuilder().build()).toEqual({})
  })

  it("only emits $set when no unsets are recorded", () => {
    const ops = new MongoUpdateBuilder()
      .set("name", "Acme")
      .set("vat", 21)
      .build()
    expect(ops).toEqual({ $set: { name: "Acme", vat: 21 } })
  })

  it("only emits $unset when no sets are recorded", () => {
    const ops = new MongoUpdateBuilder()
      .setOrUnset("phone", undefined)
      .setOrUnset("email", null)
      .build()
    expect(ops).toEqual({ $unset: { phone: true, email: true } })
  })

  it("emits both $set and $unset when mixed", () => {
    const ops = new MongoUpdateBuilder()
      .set("updatedAt", "now")
      .setOrUnset("phone", "+34 600 000 000")
      .setOrUnset("email", undefined)
      .build()
    expect(ops).toEqual({
      $set: { updatedAt: "now", phone: "+34 600 000 000" },
      $unset: { email: true },
    })
  })

  it("setOrUnset sets falsy non-nullish values (0, '', false)", () => {
    const ops = new MongoUpdateBuilder()
      .setOrUnset("zero", 0)
      .setOrUnset("empty", "")
      .setOrUnset("flag", false)
      .build()
    expect(ops).toEqual({ $set: { zero: 0, empty: "", flag: false } })
  })

  it("set always sets regardless of value", () => {
    const ops = new MongoUpdateBuilder()
      .set("a", null)
      .set("b", undefined)
      .build()
    expect(ops).toEqual({ $set: { a: null, b: undefined } })
  })
})
