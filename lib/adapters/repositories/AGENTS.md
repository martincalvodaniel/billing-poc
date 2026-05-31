# Repositories — Mongo Adapter Guidelines

This folder contains the MongoDB adapters that implement the domain ports
declared in `lib/domain/ports/`. Repositories are the only layer allowed to
talk to the Mongo driver. Domain services, API routes, and components must
never import from `mongodb` directly.

## Hexagonal Boundary
- Each repo implements a port interface (e.g.
  `MongoPaymentRepository implements PaymentRepository`).
- Domain entities (`lib/domain/entities/`) are plain TypeScript and never
  reference `ObjectId`, `Db`, `Filter`, or any Mongo type. IDs are `string`.
- Persistence shapes live in `lib/types.ts` as `Mongo`-prefixed types
  (`MongoPayment`, `MongoClient`, `MongoEvent`, `MongoEventAttendee`,
  `MongoAbsence`, `MongoInvoiceCounter`). Each is derived from its domain
  entity via `Omit<...>` and only re-types the identity / foreign-key fields
  as `ObjectId` (plus persistence-only fields such as
  `MongoAbsence.studentNameLower`), so value types stay single-sourced in the
  entities and the two shapes cannot drift. These `Mongo*` types must be
  imported **only** inside this folder — a stray import elsewhere is a
  boundary violation.
- Convert at the boundary: `toDomain(doc)` on read, `toObjectId(id)` /
  shape-mapping on write. Never leak Mongo documents past the repository.

## Mongo Write Rule — Never Persist Nullish Field Values
Documents must never contain `null` or `undefined` for optional fields. Use
`omitNullish` to strip those keys before insert/update, and use `$unset`
when the intent is to truly remove a previously-stored field.

Why:
- The Node driver default is `ignoreUndefined: false`, so a JS `undefined`
  on an insert/update document is serialised as BSON `null` — silently
  poisoning the schema.
- Query-side `{ field: null }` matches both BSON null and missing field
  (see `buildEventListQuery` in `mongo-event-repository-helpers.ts`). That
  invariant only holds if writes never emit nulls.
- Optional domain fields (e.g. `payment.discount`, `payment.surcharge`,
  `payment.tag`, `client.phone`, `client.email`, `client.taxId`,
  `client.address`) must be absent from the document
  when not provided — not stored as `null`.

How:
- **Inserts**: build the doc, then pass through `omitNullish` (or build it
  conditionally) so nullish keys are dropped before `insertOne`.
- **Updates**: use the `MongoUpdateBuilder` from `./mongo-utils` to
  accumulate operations and emit a single `updateOne(..., builder.build())`
  call. Use `set(field, value)` for fields that must always be written
  (e.g. `updatedAt`, required scalars) and `setOrUnset(field, value)` for
  optional fields — defined values go to `$set`, `null`/`undefined` go to
  `$unset` (true removal). The builder omits empty `$set`/`$unset` clauses
  automatically. For single-field composition, the standalone
  `setOrUnset(field, value)` helper returns `{ set?, unset? }` parts.
- **Never** write `data.field || null` or `data.field ?? null`. Omit the
  key or `$unset` it instead.
- **Semantic-zero fields**: when 0 means "no value" for a domain (e.g.
  `payment.discount`), the repo maps 0 → undefined and `setOrUnset` then
  emits `$unset`. For fields where 0 is a legitimate value (e.g.
  `payment.surcharge`, `vat`), always `set` 0 explicitly.
- **Empty-string optional strings**: trim and treat the empty result as
  undefined before passing to `setOrUnset` (applies to `payment.tag`,
  `payment.deliveryNoteRef`,
  `client.taxId`, `client.address`, `client.phone`, `client.email`).

Per-field examples:
- `payments`: `discount`, `surcharge`, `tag`, `clientId`,
  `deliveryNoteRef`, `invoice`.
- `clients`: `phone`, `email`, `taxId`, `address`.
- `events`: `day`, `hour`, `minute`, `date`,
  `durationMinutes`, `maxAttendees`.
- `invoiceCounters`: only mutate `lastNumber`; no nullable fields.

## Read-Time Invoice Migration
`MongoPaymentRepository.toDomain` delegates to `mapPaymentDocToDomain`
(see `mongo-payment-repository-utils.ts`), which performs read-time
migration of legacy persistence shapes onto the unified domain model:
- Invoice metadata field renames: `series` → `type`,
  `formattedNumber` → `id`; legacy `number` is dropped (UI shows `id`).
- Legacy outcome `providerBillLink` (manual URL) and
  `providerBillUrl` (+ `providerBillPathname`) top-level fields are
  lifted into the unified `invoices[]` array as
  `{ type: "Invoice", link, generatedAt }` and
  `{ type: "Invoice", blobUrl, blobPathname?, generatedAt }` entries
  respectively. `generatedAt` falls back to `updatedAt` / `createdAt`.

The repository never writes those legacy top-level fields any more; the
mapper exists so existing documents continue to load without an offline
backfill.

## ObjectId Boundary Conversions
- Inbound (API → repo): incoming IDs are strings. Validate with
  `ObjectId.isValid(id)` (or a local `isValidObjectId` helper) and reject
  before calling `new ObjectId(id)` to avoid driver throws.
- Outbound (repo → domain): map `_id` and any FK fields via `.toString()`
  in the `toDomain` mapper. Domain entities expose IDs as `string`.
- Never compare ObjectIds with `===`; compare their string forms or use
  `ObjectId.equals`.

## Index Bootstrap — `ensureIndexesOnce`
- Index specs live in `./ensure-indexes.ts` (`INDEX_SPECS`).
- `lib/mongodb.ts` calls `ensureIndexesOnce(db)` inside `getDatabase()`,
  which runs `ensureIndexes` exactly once per process (memoised promise,
  resets on failure to allow retry on the next call).
- When adding a new collection or query pattern, append the relevant
  index spec to `INDEX_SPECS` rather than creating indexes ad-hoc inside a
  repository method.

## Query Builders — Pure & Tested
- Extract complex query shapes (date ranges, partial-date `$or`, etc.)
  into pure helper functions colocated with the repository (see
  `buildEventListQuery` in `mongo-event-repository-helpers.ts`).
- Unit-test query builders directly with `bun:test` — assert the returned
  Mongo filter object. They are pure, synchronous, and need no DB.
- Repository class methods stay thin: get collection, build query via the
  helper, run the driver call, map with `toDomain`.

## Testing Pattern
- Pure helpers (query builders, mappers, `omitNullish`, `setOrUnset`) get
  `*.test.ts` files alongside the source.
- Do not write integration tests against a live Mongo instance from this
  folder; the test suite must remain hermetic (`bun test` with no env).
- For repository-level behaviour that depends on the driver, prefer
  exercising it through API route tests or extracting the logic into a
  pure helper that can be tested in isolation.

## Don'ts
- No raw `db.collection(...)` calls outside repositories.
- No `as any` to silence Mongo typing — narrow with explicit casts to
  `MongoX` document types from `lib/types.ts`.
- No business logic in repositories (calculations, validation,
  authorisation) — those belong in `lib/domain/services/` and API routes.
- No default exports; named exports only.
