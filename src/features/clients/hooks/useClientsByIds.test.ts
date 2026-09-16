"use client"

import { describe, expect, test } from "bun:test"
import {
  buildClientsByIdsKey,
  buildClientsByIdsUrls,
  CLIENT_IDS_PER_REQUEST,
  normalizeClientIds,
} from "./useClientsByIds"

describe("normalizeClientIds", () => {
  test("trims, deduplicates, removes empty IDs, and sorts", () => {
    expect(normalizeClientIds([" b ", "", "a", "b", "  "])).toEqual(["a", "b"])
  })
})

describe("buildClientsByIdsKey", () => {
  test("returns null when there are no client IDs", () => {
    expect(buildClientsByIdsKey([])).toBeNull()
  })

  test("is stable regardless of ID order and duplicates", () => {
    expect(buildClientsByIdsKey(["b", "a", "a"])).toEqual(
      buildClientsByIdsKey(["a", "b"])
    )
    expect(buildClientsByIdsKey(["b", "a"])).toEqual([
      "/api/clients",
      "by-ids",
      '["a","b"]',
    ])
  })
})

describe("buildClientsByIdsUrls", () => {
  test("builds a repeated id query with encoded values", () => {
    expect(buildClientsByIdsUrls(["client 2", "client&1"])).toEqual([
      "/api/clients/by-ids?id=client+2&id=client%261",
    ])
  })

  test("splits large lookups into bounded requests", () => {
    const ids = Array.from(
      { length: CLIENT_IDS_PER_REQUEST + 1 },
      (_, index) => `client-${index.toString().padStart(2, "0")}`
    )
    const urls = buildClientsByIdsUrls(ids)

    expect(urls).toHaveLength(2)
    expect(
      new URL(urls[0], "https://example.com").searchParams.getAll("id")
    ).toHaveLength(CLIENT_IDS_PER_REQUEST)
    expect(
      new URL(urls[1], "https://example.com").searchParams.getAll("id")
    ).toHaveLength(1)
  })
})
