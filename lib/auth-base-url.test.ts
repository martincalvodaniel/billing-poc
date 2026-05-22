import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { getAuthBaseURL } from "./auth-base-url"

const ENV_KEYS = [
  "BETTER_AUTH_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
] as const

describe("getAuthBaseURL", () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key]
      delete process.env[key]
    }
  })

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = saved[key]
      }
    }
  })

  test("uses BETTER_AUTH_URL as-is when set (no prefixing)", () => {
    process.env.BETTER_AUTH_URL = "https://auth.example.com"
    process.env.VERCEL_BRANCH_URL = "branch.vercel.app"
    expect(getAuthBaseURL()).toBe("https://auth.example.com")
  })

  test("prefixes VERCEL_BRANCH_URL with https://", () => {
    process.env.VERCEL_BRANCH_URL = "branch.vercel.app"
    expect(getAuthBaseURL()).toBe("https://branch.vercel.app")
  })

  test("VERCEL_BRANCH_URL takes precedence over VERCEL_URL", () => {
    process.env.VERCEL_BRANCH_URL = "branch.vercel.app"
    process.env.VERCEL_URL = "deployment.vercel.app"
    expect(getAuthBaseURL()).toBe("https://branch.vercel.app")
  })

  test("falls back to VERCEL_URL when VERCEL_BRANCH_URL is unset", () => {
    process.env.VERCEL_URL = "deployment.vercel.app"
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "prod.vercel.app"
    expect(getAuthBaseURL()).toBe("https://deployment.vercel.app")
  })

  test("falls back to VERCEL_PROJECT_PRODUCTION_URL when others unset", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "prod.vercel.app"
    expect(getAuthBaseURL()).toBe("https://prod.vercel.app")
  })

  test("defaults to http://localhost:3000 when nothing is set", () => {
    expect(getAuthBaseURL()).toBe("http://localhost:3000")
  })

  test("strips trailing slash", () => {
    process.env.BETTER_AUTH_URL = "https://auth.example.com/"
    expect(getAuthBaseURL()).toBe("https://auth.example.com")
  })

  test("strips trailing slash on prefixed Vercel URLs", () => {
    process.env.VERCEL_BRANCH_URL = "branch.vercel.app/"
    expect(getAuthBaseURL()).toBe("https://branch.vercel.app")
  })
})
