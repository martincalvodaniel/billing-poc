"use client"

import { describe, expect, test } from "bun:test"
import { buildAccentInsensitivePattern } from "@/lib/utils/text-search"
import { buildClientSearchQuery } from "./mongo-client-repository-helpers"

describe("buildClientSearchQuery", () => {
  test("returns an empty query when search is missing", () => {
    expect(buildClientSearchQuery()).toEqual({})
  })

  test("returns an empty query when search is whitespace only", () => {
    expect(buildClientSearchQuery("   ")).toEqual({})
  })

  test("matches name, taxId, and email with the same accent-insensitive pattern", () => {
    const searchPattern = {
      $regex: buildAccentInsensitivePattern("Jose"),
      $options: "i",
    }

    expect(buildClientSearchQuery("Jose")).toEqual({
      $or: [
        { name: searchPattern },
        { taxId: searchPattern },
        { email: searchPattern },
      ],
    })
  })
})
