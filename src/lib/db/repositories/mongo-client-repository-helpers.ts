import type { Filter } from "mongodb"
import { buildAccentInsensitivePattern } from "@/lib/utils/text-search"
import type { MongoClient } from "../types"

export function buildClientSearchQuery(search?: string): Filter<MongoClient> {
  const trimmedSearch = search?.trim()
  if (!trimmedSearch) {
    return {}
  }

  const pattern = buildAccentInsensitivePattern(trimmedSearch)
  const searchPattern = { $regex: pattern, $options: "i" }

  return {
    $or: [
      { name: searchPattern },
      { taxId: searchPattern },
      { email: searchPattern },
    ],
  }
}
