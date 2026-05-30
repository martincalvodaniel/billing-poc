import { describe, expect, test } from "bun:test"
import type { ObjectId } from "mongodb"
import type { InvoiceMetadata, Payment, PaymentType } from "@/lib/types"
import {
  derivePaymentTagOptions,
  filterPayments,
  nextSortState,
  paymentHasInvoice,
  sortPayments,
} from "./monthlyPaymentsView-filters"

function makePayment(overrides: Partial<Payment> & { id: string }): Payment {
  const {
    id,
    type = "income" as PaymentType,
    date = "2026-05-10",
    tag,
    total = 100,
    vatAmount = 21,
    surchargeAmount,
    netAmount = 79,
    invoice,
    invoices,
    createdAt = new Date("2026-05-10T10:00:00Z"),
    updatedAt = new Date("2026-05-10T10:00:00Z"),
    ...rest
  } = overrides
  return {
    _id: id as unknown as ObjectId,
    type,
    date,
    tag,
    concepts: [{ name: "x", amount: total, quantity: 1 }],
    vat: 21,
    total,
    vatAmount,
    surchargeAmount,
    netAmount,
    invoice,
    invoices,
    createdAt,
    updatedAt,
    ...rest,
  }
}

const sampleInvoice: InvoiceMetadata = {
  series: "Invoice",
  number: 1,
  formattedNumber: "F26_001",
  generatedAt: new Date("2026-05-10T10:00:00Z"),
}

describe("paymentHasInvoice", () => {
  test("returns false when no invoice fields set", () => {
    expect(paymentHasInvoice(makePayment({ id: "1" }))).toBe(false)
  })

  test("returns true for legacy invoice field", () => {
    expect(
      paymentHasInvoice(makePayment({ id: "1", invoice: sampleInvoice }))
    ).toBe(true)
  })

  test("returns true for non-empty invoices array", () => {
    expect(
      paymentHasInvoice(makePayment({ id: "1", invoices: [sampleInvoice] }))
    ).toBe(true)
  })

  test("returns false for empty invoices array", () => {
    expect(paymentHasInvoice(makePayment({ id: "1", invoices: [] }))).toBe(
      false
    )
  })
})

describe("derivePaymentTagOptions", () => {
  test("returns unique, sorted, non-empty tags", () => {
    const payments = [
      makePayment({ id: "1", tag: "Rent" }),
      makePayment({ id: "2", tag: "Food" }),
      makePayment({ id: "3", tag: "Rent" }),
      makePayment({ id: "4", tag: "" }),
      makePayment({ id: "5" }),
    ]
    expect(derivePaymentTagOptions(payments)).toEqual(["Food", "Rent"])
  })

  test("returns empty array when no tags", () => {
    expect(derivePaymentTagOptions([makePayment({ id: "1" })])).toEqual([])
  })
})

describe("filterPayments", () => {
  const base = [
    makePayment({
      id: "1",
      type: "income",
      tag: "Rent",
      invoice: sampleInvoice,
    }),
    makePayment({ id: "2", type: "outcome", tag: "Food" }),
    makePayment({
      id: "3",
      type: "income",
      tag: "Food",
      invoices: [sampleInvoice],
    }),
    makePayment({ id: "4", type: "outcome" }),
  ]

  test("type=all skips type filter", () => {
    const out = filterPayments(base, {
      type: "all",
      hasInvoice: "all",
      tags: [],
    })
    expect(out).toHaveLength(4)
  })

  test("type=income filters", () => {
    const out = filterPayments(base, {
      type: "income",
      hasInvoice: "all",
      tags: [],
    })
    expect(out.map((p) => p._id)).toEqual(["1", "3"] as unknown as ObjectId[])
  })

  test("type=outcome filters", () => {
    const out = filterPayments(base, {
      type: "outcome",
      hasInvoice: "all",
      tags: [],
    })
    expect(out.map((p) => p._id)).toEqual(["2", "4"] as unknown as ObjectId[])
  })

  test("hasInvoice=yes filters", () => {
    const out = filterPayments(base, {
      type: "all",
      hasInvoice: "yes",
      tags: [],
    })
    expect(out.map((p) => p._id)).toEqual(["1", "3"] as unknown as ObjectId[])
  })

  test("hasInvoice=no filters", () => {
    const out = filterPayments(base, {
      type: "all",
      hasInvoice: "no",
      tags: [],
    })
    expect(out.map((p) => p._id)).toEqual(["2", "4"] as unknown as ObjectId[])
  })

  test("tags filter keeps only matching", () => {
    const out = filterPayments(base, {
      type: "all",
      hasInvoice: "all",
      tags: ["Food"],
    })
    expect(out.map((p) => p._id)).toEqual(["2", "3"] as unknown as ObjectId[])
  })

  test("tags filter excludes untagged payments", () => {
    const out = filterPayments(base, {
      type: "all",
      hasInvoice: "all",
      tags: ["Rent"],
    })
    expect(out.map((p) => p._id)).toEqual(["1"] as unknown as ObjectId[])
  })

  test("composes all axes", () => {
    const out = filterPayments(base, {
      type: "income",
      hasInvoice: "yes",
      tags: ["Food"],
    })
    expect(out.map((p) => p._id)).toEqual(["3"] as unknown as ObjectId[])
  })

  test("multiple tags act as OR", () => {
    const out = filterPayments(base, {
      type: "all",
      hasInvoice: "all",
      tags: ["Rent", "Food"],
    })
    expect(out).toHaveLength(3)
  })
})

describe("sortPayments", () => {
  test("does not mutate input", () => {
    const arr = [
      makePayment({ id: "1", total: 10 }),
      makePayment({ id: "2", total: 20 }),
    ]
    const snapshot = arr.map((p) => p._id)
    sortPayments(arr, "total", "desc")
    expect(arr.map((p) => p._id)).toEqual(snapshot)
  })

  test("sorts by day asc/desc", () => {
    const arr = [
      makePayment({ id: "a", date: "2026-05-10" }),
      makePayment({ id: "b", date: "2026-05-01" }),
      makePayment({ id: "c", date: "2026-05-20" }),
    ]
    expect(sortPayments(arr, "day", "asc").map((p) => p._id)).toEqual([
      "b",
      "a",
      "c",
    ] as unknown as ObjectId[])
    expect(sortPayments(arr, "day", "desc").map((p) => p._id)).toEqual([
      "c",
      "a",
      "b",
    ] as unknown as ObjectId[])
  })

  test("sorts by type", () => {
    const arr = [
      makePayment({ id: "a", type: "outcome" }),
      makePayment({ id: "b", type: "income" }),
    ]
    expect(sortPayments(arr, "type", "asc").map((p) => p._id)).toEqual([
      "b",
      "a",
    ] as unknown as ObjectId[])
    expect(sortPayments(arr, "type", "desc").map((p) => p._id)).toEqual([
      "a",
      "b",
    ] as unknown as ObjectId[])
  })

  test("sorts by tag with empties last in both directions", () => {
    const arr = [
      makePayment({ id: "a", tag: "Rent" }),
      makePayment({ id: "b" }),
      makePayment({ id: "c", tag: "Food" }),
    ]
    expect(sortPayments(arr, "tag", "asc").map((p) => p._id)).toEqual([
      "c",
      "a",
      "b",
    ] as unknown as ObjectId[])
    expect(sortPayments(arr, "tag", "desc").map((p) => p._id)).toEqual([
      "a",
      "c",
      "b",
    ] as unknown as ObjectId[])
  })

  test("sorts by total / net / vat / surcharge", () => {
    const arr = [
      makePayment({
        id: "a",
        total: 10,
        netAmount: 8,
        vatAmount: 2,
        surchargeAmount: 1,
      }),
      makePayment({
        id: "b",
        total: 30,
        netAmount: 24,
        vatAmount: 6,
        surchargeAmount: 3,
      }),
      makePayment({
        id: "c",
        total: 20,
        netAmount: 16,
        vatAmount: 4,
        surchargeAmount: 2,
      }),
    ]
    expect(sortPayments(arr, "total", "asc").map((p) => p._id)).toEqual([
      "a",
      "c",
      "b",
    ] as unknown as ObjectId[])
    expect(sortPayments(arr, "total", "desc").map((p) => p._id)).toEqual([
      "b",
      "c",
      "a",
    ] as unknown as ObjectId[])
    expect(sortPayments(arr, "net", "asc").map((p) => p._id)).toEqual([
      "a",
      "c",
      "b",
    ] as unknown as ObjectId[])
    expect(sortPayments(arr, "vat", "desc").map((p) => p._id)).toEqual([
      "b",
      "c",
      "a",
    ] as unknown as ObjectId[])
    expect(sortPayments(arr, "surcharge", "asc").map((p) => p._id)).toEqual([
      "a",
      "c",
      "b",
    ] as unknown as ObjectId[])
  })

  test("treats missing surcharge as 0", () => {
    const arr = [
      makePayment({ id: "a" }),
      makePayment({ id: "b", surchargeAmount: 5 }),
    ]
    expect(sortPayments(arr, "surcharge", "desc").map((p) => p._id)).toEqual([
      "b",
      "a",
    ] as unknown as ObjectId[])
  })

  test("sorts by invoices presence", () => {
    const arr = [
      makePayment({ id: "a" }),
      makePayment({ id: "b", invoice: sampleInvoice }),
      makePayment({ id: "c", invoices: [sampleInvoice] }),
    ]
    expect(
      sortPayments(arr, "invoices", "desc")
        .map((p) => p._id)
        .slice(0, 2)
    ).toEqual(["b", "c"] as unknown as ObjectId[])
    expect(sortPayments(arr, "invoices", "asc").map((p) => p._id)[0]).toEqual(
      "a" as unknown as ObjectId
    )
  })

  test("ties break by createdAt desc", () => {
    const older = new Date("2026-05-01T10:00:00Z")
    const newer = new Date("2026-05-09T10:00:00Z")
    const arr = [
      makePayment({ id: "old", total: 10, createdAt: older }),
      makePayment({ id: "new", total: 10, createdAt: newer }),
    ]
    expect(sortPayments(arr, "total", "asc").map((p) => p._id)).toEqual([
      "new",
      "old",
    ] as unknown as ObjectId[])
    expect(sortPayments(arr, "total", "desc").map((p) => p._id)).toEqual([
      "new",
      "old",
    ] as unknown as ObjectId[])
  })
})

describe("nextSortState", () => {
  test("flips direction when same key", () => {
    expect(nextSortState({ sortBy: "day", sortDir: "desc" }, "day")).toEqual({
      sortBy: "day",
      sortDir: "asc",
    })
    expect(nextSortState({ sortBy: "day", sortDir: "asc" }, "day")).toEqual({
      sortBy: "day",
      sortDir: "desc",
    })
  })

  test("switches key with desc default", () => {
    expect(nextSortState({ sortBy: "day", sortDir: "asc" }, "total")).toEqual({
      sortBy: "total",
      sortDir: "desc",
    })
  })
})
