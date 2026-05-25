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

describe("buildPaymentUpdateOps — surcharge removal", () => {
  test("surcharge: 0 emits $unset.surcharge and no $set.surcharge", () => {
    const ops = buildPaymentUpdateOps({ surcharge: 0 })

    expect(ops.$unset?.surcharge).toBe(true)
    expect(ops.$set?.surcharge).toBeUndefined()
  })

  test("positive surcharge goes to $set and not $unset", () => {
    const ops = buildPaymentUpdateOps({ surcharge: 21 })

    expect(ops.$set?.surcharge).toBe(21)
    expect(ops.$unset?.surcharge).toBeUndefined()
  })

  test("omitted surcharge touches neither $set nor $unset", () => {
    const ops = buildPaymentUpdateOps({ vat: 21 })

    expect(ops.$set?.surcharge).toBeUndefined()
    expect(ops.$unset?.surcharge).toBeUndefined()
  })
})

describe("buildPaymentUpdateOps — surchargeAmount removal", () => {
  test("surchargeAmount: 0 emits $unset.surchargeAmount", () => {
    const ops = buildPaymentUpdateOps({ surchargeAmount: 0 })

    expect(ops.$unset?.surchargeAmount).toBe(true)
    expect(ops.$set?.surchargeAmount).toBeUndefined()
  })

  test("positive surchargeAmount is $set", () => {
    const ops = buildPaymentUpdateOps({ surchargeAmount: 2.5 })

    expect(ops.$set?.surchargeAmount).toBe(2.5)
    expect(ops.$unset?.surchargeAmount).toBeUndefined()
  })

  test("omitted surchargeAmount touches neither $set nor $unset", () => {
    const ops = buildPaymentUpdateOps({ vat: 21 })

    expect(ops.$set?.surchargeAmount).toBeUndefined()
    expect(ops.$unset?.surchargeAmount).toBeUndefined()
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

describe("buildPaymentUpdateOps — paymentMethod", () => {
  test("enum value goes to $set, no $unset", () => {
    const ops = buildPaymentUpdateOps({ paymentMethod: "cash" })
    expect(ops.$set?.paymentMethod).toBe("cash")
    expect(ops.$unset?.paymentMethod).toBeUndefined()
  })

  test("empty string goes to $unset, no $set", () => {
    const ops = buildPaymentUpdateOps({
      paymentMethod: "" as unknown as "cash",
    })
    expect(ops.$unset?.paymentMethod).toBe(true)
    expect(ops.$set?.paymentMethod).toBeUndefined()
  })

  test("absent key touches neither $set nor $unset", () => {
    const ops = buildPaymentUpdateOps({ vat: 21 })
    expect(ops.$set?.paymentMethod).toBeUndefined()
    expect(ops.$unset?.paymentMethod).toBeUndefined()
  })
})
