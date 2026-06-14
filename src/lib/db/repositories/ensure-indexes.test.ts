import { describe, expect, test } from "bun:test"
import { INDEX_SPECS } from "./ensure-indexes"

describe("INDEX_SPECS", () => {
  test("every spec has a stable name", () => {
    for (const s of INDEX_SPECS) expect(s.options?.name).toBeTruthy()
  })

  test("index names are unique within each collection", () => {
    const seen = new Map<string, Set<string>>()
    for (const s of INDEX_SPECS) {
      const set = seen.get(s.collection) ?? new Set()
      const name = s.options?.name
      expect(name).toBeTruthy()
      expect(set.has(name as string)).toBe(false)
      set.add(name as string)
      seen.set(s.collection, set)
    }
  })

  test("covers every collection used by the app", () => {
    const cols = new Set(INDEX_SPECS.map((s) => s.collection))
    for (const c of [
      "payments",
      "clients",
      "absences",
      "events",
      "invoiceCounters",
      "paymentTemplates",
    ]) {
      expect(cols.has(c)).toBe(true)
    }
  })

  test("uniqueness flags are correctly placed", () => {
    const uniques = INDEX_SPECS.filter((s) => s.options?.unique)
    const names = uniques.map((s) => `${s.collection}.${s.options?.name}`)
    expect(names).toContain("absences.uniq_student_date_part")
    expect(names).toContain("invoiceCounters.uniq_series_year")
  })
})
