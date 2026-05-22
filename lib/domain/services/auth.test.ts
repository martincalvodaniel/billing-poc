import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { isEmailAllowed } from "./auth"

describe("isEmailAllowed", () => {
  const originalAllowedEmails = process.env.ALLOWED_EMAILS

  beforeEach(() => {
    delete process.env.ALLOWED_EMAILS
  })

  afterEach(() => {
    if (originalAllowedEmails === undefined) {
      delete process.env.ALLOWED_EMAILS
    } else {
      process.env.ALLOWED_EMAILS = originalAllowedEmails
    }
  })

  it("returns true when email is in ALLOWED_EMAILS", () => {
    process.env.ALLOWED_EMAILS = "alice@example.com,bob@example.com"
    expect(isEmailAllowed("alice@example.com")).toBe(true)
    expect(isEmailAllowed("bob@example.com")).toBe(true)
  })

  it("returns false when email is not in the allowlist", () => {
    process.env.ALLOWED_EMAILS = "alice@example.com"
    expect(isEmailAllowed("eve@example.com")).toBe(false)
  })

  it("matches emails case-insensitively", () => {
    process.env.ALLOWED_EMAILS = "Alice@Example.com"
    expect(isEmailAllowed("alice@example.com")).toBe(true)
    expect(isEmailAllowed("ALICE@EXAMPLE.COM")).toBe(true)
  })

  it("tolerates whitespace around entries in ALLOWED_EMAILS", () => {
    process.env.ALLOWED_EMAILS = "  alice@example.com ,  bob@example.com  "
    expect(isEmailAllowed("alice@example.com")).toBe(true)
    expect(isEmailAllowed("bob@example.com")).toBe(true)
  })

  it("returns false for an empty email string", () => {
    process.env.ALLOWED_EMAILS = "alice@example.com"
    expect(isEmailAllowed("")).toBe(false)
  })

  it("returns false when ALLOWED_EMAILS is missing", () => {
    delete process.env.ALLOWED_EMAILS
    expect(isEmailAllowed("alice@example.com")).toBe(false)
  })

  it("returns false when ALLOWED_EMAILS is empty", () => {
    process.env.ALLOWED_EMAILS = ""
    expect(isEmailAllowed("alice@example.com")).toBe(false)
  })

  it("ignores empty entries in the allowlist", () => {
    process.env.ALLOWED_EMAILS = ",,alice@example.com,,"
    expect(isEmailAllowed("alice@example.com")).toBe(true)
    expect(isEmailAllowed("")).toBe(false)
  })
})
