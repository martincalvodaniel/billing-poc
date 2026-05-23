import { beforeAll, describe, expect, test } from "bun:test"

process.env.MONGODB_URI ??= "mongodb://localhost:27017/test"

type BuildPaymentUpdateOps =
  typeof import("./mongo-payment-repository")["buildPaymentUpdateOps"]

let buildPaymentUpdateOps: BuildPaymentUpdateOps

beforeAll(async () => {
  ;({ buildPaymentUpdateOps } = await import("./mongo-payment-repository"))
})

describe("buildPaymentUpdateOps — discount removal", () => {
  test("discount: 0 emits $unset.discount and no $set.discount", () => {
    const ops = buildPaymentUpdateOps({ discount: 0 })

    expect(ops.$unset).toEqual({ discount: true })
    expect(ops.$set?.discount).toBeUndefined()
  })

  test("explicit positive discount goes to $set and not $unset", () => {
    const ops = buildPaymentUpdateOps({ discount: 12.5 })

    expect(ops.$set?.discount).toBe(12.5)
    expect(ops.$unset?.discount).toBeUndefined()
  })

  test("omitted discount touches neither $set nor $unset for discount", () => {
    const ops = buildPaymentUpdateOps({ vat: 21 })

    expect(ops.$set?.discount).toBeUndefined()
    expect(ops.$unset?.discount).toBeUndefined()
  })
})

describe("buildPaymentUpdateOps — surcharge passthrough", () => {
  test("surcharge: 0 is $set as 0 (legitimate value, not unset)", () => {
    const ops = buildPaymentUpdateOps({ surcharge: 0 })

    expect(ops.$set?.surcharge).toBe(0)
    expect(ops.$unset?.surcharge).toBeUndefined()
  })

  test("positive surcharge is $set", () => {
    const ops = buildPaymentUpdateOps({ surcharge: 5 })

    expect(ops.$set?.surcharge).toBe(5)
  })
})

describe("buildPaymentUpdateOps — invariants", () => {
  test("always refreshes updatedAt", () => {
    const ops = buildPaymentUpdateOps({})
    expect(ops.$set?.updatedAt).toBeInstanceOf(Date)
  })

  test("empty-string tag becomes $unset", () => {
    const ops = buildPaymentUpdateOps({ tag: "   " })
    expect(ops.$unset?.tag).toBe(true)
    expect(ops.$set?.tag).toBeUndefined()
  })
})
