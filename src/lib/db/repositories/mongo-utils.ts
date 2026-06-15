/**
 * Mongo write helpers enforcing the repository rule: never persist `null` or
 * `undefined` field values. Use `omitNullish` for inserts and additive
 * updates; use `setOrUnset` to compose `$set`/`$unset` operations that
 * actually remove a field from the document.
 *
 * Background: the Mongo Node driver defaults to `ignoreUndefined: false`, so
 * a JavaScript `undefined` is serialised as BSON `null`. Stripping nullish
 * values at the boundary keeps documents shape-stable and lets query-side
 * `field: null` checks (see `buildEventListQuery`) match only intentionally
 * absent fields.
 */

import { ObjectId } from "mongodb"

/**
 * Single, validated `string` → `ObjectId` coercion for every repository.
 * Callers must guard untrusted ids with `isValidObjectId` first (returning a
 * clean `null`/`false`) so a malformed id never reaches `new ObjectId(id)`
 * and throws a `BSONError` instead of failing gracefully.
 */
export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id)
}

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
}

export function omitNullish<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const out: Partial<T> = {}
  for (const key of Object.keys(obj) as Array<keyof T>) {
    const value = obj[key]
    if (value === null || value === undefined) continue
    out[key] = value
  }
  return out
}

export interface SetOrUnsetResult {
  set?: Record<string, unknown>
  unset?: Record<string, true>
}

export function setOrUnset(field: string, value: unknown): SetOrUnsetResult {
  if (value === null || value === undefined) {
    return { unset: { [field]: true } }
  }
  return { set: { [field]: value } }
}

export interface UpdateOps {
  $set?: Record<string, unknown>
  $unset?: Record<string, true>
}

/**
 * Accumulates `$set` and `$unset` field operations and produces a single
 * Mongo update document. Empty `$set`/`$unset` clauses are omitted from the
 * built result so callers never send `{ $set: {} }`.
 */
export class MongoUpdateBuilder {
  private readonly setData: Record<string, unknown> = {}
  private readonly unsetData: Record<string, true> = {}

  /** Always `$set` the field, regardless of value (use for required fields). */
  set(field: string, value: unknown): this {
    this.setData[field] = value
    return this
  }

  /** `$set` when value is defined and non-null; `$unset` otherwise. */
  setOrUnset(field: string, value: unknown): this {
    if (value === null || value === undefined) {
      this.unsetData[field] = true
    } else {
      this.setData[field] = value
    }
    return this
  }

  build(): UpdateOps {
    const ops: UpdateOps = {}
    if (Object.keys(this.setData).length > 0) ops.$set = this.setData
    if (Object.keys(this.unsetData).length > 0) ops.$unset = this.unsetData
    return ops
  }
}
