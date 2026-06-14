import { describe, expect, it } from "bun:test"
import {
  buildAccentInsensitivePattern,
  escapeRegex,
  stripDiacritics,
} from "./text-search"

describe("stripDiacritics", () => {
  it("removes accents from latin characters", () => {
    expect(stripDiacritics("José Martínez")).toBe("Jose Martinez")
  })
})

describe("escapeRegex", () => {
  it("escapes regex metacharacters", () => {
    expect(escapeRegex("a.b*c")).toBe("a\\.b\\*c")
  })
})

describe("buildAccentInsensitivePattern", () => {
  it("matches accented variants case-insensitively", () => {
    const re = new RegExp(buildAccentInsensitivePattern("jose"), "i")
    expect(re.test("José Martínez")).toBe(true)
  })

  it("matches Martínez when searching martinez", () => {
    const re = new RegExp(buildAccentInsensitivePattern("martinez"), "i")
    expect(re.test("Martínez")).toBe(true)
  })

  it("escapes dot so j.ose does not match José Martínez", () => {
    const re = new RegExp(buildAccentInsensitivePattern("j.ose"), "i")
    expect(re.test("José Martínez")).toBe(false)
    expect(re.test("j.ose")).toBe(true)
  })
})
