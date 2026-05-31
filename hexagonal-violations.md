# Hexagonal Architecture Violations

This document reviews the Billing POC against hexagonal (ports & adapters)
architecture principles: **separation of concerns**, **dependency
inversion**, and a clean **ports & adapters** boundary. Each violation below
was verified against the current codebase. For every finding you get: the
principle violated, the concrete affected files, and a specific suggested
change. Verified non-violations are listed at the end.

> Scope note: this document is descriptive only. No production code is
> changed by authoring it.

---

## The intended boundary (baseline)

Per [AGENTS.md](AGENTS.md) and
[lib/adapters/repositories/AGENTS.md](lib/adapters/repositories/AGENTS.md):

- **Domain entities** live in `lib/domain/entities/` and are plain
  TypeScript — they must **never** reference `ObjectId`, `Db`, `Filter`, or
  any Mongo type. IDs are exposed as `string`.
- **Persistence shapes** (the Mongo documents, with `ObjectId` fields) live
  in [lib/types.ts](lib/types.ts) and are used **only** inside the
  repository adapters.
- **Repositories** in `lib/adapters/repositories/` are the only layer
  allowed to import from `mongodb`, and they convert at the boundary
  (`toDomain` on read, `toObjectId` on write).
- **Ports** in `lib/domain/ports/` are the interfaces the application
  (API routes, services) depends on — not concrete adapters.

The violations below are places where this boundary is crossed or
duplicated.

---

## V1 — `ObjectId` leaks into the UI/application layer via `lib/types.ts` — ✅ RESOLVED

**Resolution:** every non-repository consumer was repointed from the Mongo
shapes in [lib/types.ts](lib/types.ts) to the domain entities in
`lib/domain/entities/*` (Phases 2a/2b/2c), and `lib/types.ts` was reduced to
hold **only** the `ObjectId`-bearing persistence shapes, now `Mongo`-prefixed
(`MongoPayment`, `MongoClient`, `MongoEvent`, `MongoEventAttendee`,
`MongoAbsence`, `MongoInvoiceCounter`) and imported only inside
`lib/adapters/repositories/`. A stray `Mongo*` import outside that folder is
now self-evidently a boundary leak. The repositories continue to convert at
the boundary (`toDomain` → string ids).

**Principle violated:** separation of concerns / ports & adapters boundary.

The persistence shapes in [lib/types.ts](lib/types.ts) carry raw Mongo
types:

```ts
// lib/types.ts
import type { ObjectId } from "mongodb"

export interface Payment {
  _id?: ObjectId
  clientId?: ObjectId
  // ...
}

export interface Client {
  _id?: ObjectId
  // ...
}
```

These same names (`Payment`, `Client`, `InvoiceMetadata`, `InvoiceType`,
`PaymentFormData`, `ClientFormData`, `PaymentConcept`, `PaymentMethod`,
`PaymentType`, `ClientType`) are **also** imported by React components,
client hooks, and even an API route — i.e. layers that must only ever see
the domain (string-id) model. Although the repositories convert `ObjectId`
→ `string` at runtime, the **static type** these consumers reference is the
Mongo-coupled one (`_id?: ObjectId`, `clientId?: ObjectId`), so the
presentation/application layer is compile-time coupled to the Mongo driver.

**Affected files** (all import the Mongo-typed model from `@/lib/types`
instead of `lib/domain/entities/`):

UI components
- [app/events/components/AttendeesPanel.tsx](app/events/components/AttendeesPanel.tsx)
- [app/month/components/PaymentDetailModal.tsx](app/month/components/PaymentDetailModal.tsx)
- [app/month/components/PaymentsTable.tsx](app/month/components/PaymentsTable.tsx)
- [app/month/components/PaymentInvoicesSection.tsx](app/month/components/PaymentInvoicesSection.tsx)
- [app/month/components/PaymentInvoicesSection-utils.ts](app/month/components/PaymentInvoicesSection-utils.ts)
- [app/month/components/MonthlyPaymentsView.tsx](app/month/components/MonthlyPaymentsView.tsx)
- [app/month/components/monthlyPaymentsView-filters.ts](app/month/components/monthlyPaymentsView-filters.ts)
- [app/month/components/DeletePaymentModal.tsx](app/month/components/DeletePaymentModal.tsx)
- [app/month/components/PaymentFormFields.tsx](app/month/components/PaymentFormFields.tsx)
- [app/month/components/PaymentConceptsList.tsx](app/month/components/PaymentConceptsList.tsx)
- [app/month/components/PaymentTypeDateRow.tsx](app/month/components/PaymentTypeDateRow.tsx)
- [app/month/components/PaymentTagVatRow.tsx](app/month/components/PaymentTagVatRow.tsx)
- [app/month/components/PaymentAdditionalFields.tsx](app/month/components/PaymentAdditionalFields.tsx)
- [app/month/components/usePaymentForm.ts](app/month/components/usePaymentForm.ts)
- [app/month/components/paymentDetailModal-seed.ts](app/month/components/paymentDetailModal-seed.ts)
- [app/components/ClientSelector.tsx](app/components/ClientSelector.tsx)
- [app/components/icons/ClientTypeIcon.tsx](app/components/icons/ClientTypeIcon.tsx)
- [app/clients/page.tsx](app/clients/page.tsx)
- [app/clients/components/ClientList.tsx](app/clients/components/ClientList.tsx)
- [app/clients/components/ClientFormModal.tsx](app/clients/components/ClientFormModal.tsx)
- [app/clients/components/ClientForm.tsx](app/clients/components/ClientForm.tsx)
- [app/clients/components/ClientTableRow.tsx](app/clients/components/ClientTableRow.tsx)
- [app/clients/components/DeleteClientModal.tsx](app/clients/components/DeleteClientModal.tsx)

Client hooks (application layer)
- [lib/hooks/usePayments.ts](lib/hooks/usePayments.ts)
- [lib/hooks/useInvoiceMutations.ts](lib/hooks/useInvoiceMutations.ts)
- [lib/hooks/useClients.ts](lib/hooks/useClients.ts)
- [lib/hooks/useClientMutations.ts](lib/hooks/useClientMutations.ts)
- [lib/hooks/usePaymentMutations.ts](lib/hooks/usePaymentMutations.ts)

API route
- [app/api/payments/[id]/invoices/link/route.ts](app/api/payments/[id]/invoices/link/route.ts)
  (imports `InvoiceMetadata` from `@/lib/types`)

Scripts (host/CLI layer)
- [scripts/payments/utils.ts](scripts/payments/utils.ts)
- [scripts/clients/utils.ts](scripts/clients/utils.ts)

**Suggested change:** point every non-repository consumer at the domain
entities instead of the Mongo shapes. The domain already defines the
string-id equivalents in
[lib/domain/entities/payment.ts](lib/domain/entities/payment.ts) (`_id?:
string`, `clientId?: string`) and
[lib/domain/entities/client.ts](lib/domain/entities/client.ts).

```diff
- import type { Payment } from "@/lib/types"
+ import type { Payment } from "@/lib/domain/entities/payment"
```

```diff
- import type { Client, ClientFormData } from "@/lib/types"
+ import type { Client, ClientFormData } from "@/lib/domain/entities/client"
```

After the migration, `lib/types.ts` should expose **only** Mongo document
shapes and be imported **only** from `lib/adapters/repositories/`. Consider
renaming the exported interfaces (e.g. `MongoPayment`, `MongoClient`) so a
stray UI import becomes obvious, mirroring the
`import { Payment as MongoPayment }` aliasing the repositories already use.

---

## V2 — Duplicate, parallel type systems (domain vs. persistence) that drift — ✅ RESOLVED

**Resolution:** the domain entities are now the single source of truth for
all value types. The missing `year` field was added to the domain
`InvoiceCounter` ([lib/domain/entities/invoice.ts](lib/domain/entities/invoice.ts)),
and the persistence shapes in [lib/types.ts](lib/types.ts) were rewritten as
`Omit<DomainEntity, idFields> & { _id?: ObjectId; ... }`. The duplicated
scalar/value types (`PaymentType`, `InvoiceType`, `InvoiceMetadata`,
`PaymentConcept`, `PaymentFormData`, `ClientFormData`, etc.) were deleted from
`lib/types.ts`; it now imports nothing but the domain entities + `ObjectId` and
only re-types identity/foreign-key fields, so the two hierarchies can no longer
drift.

**Principle violated:** separation of concerns / single source of truth.

The same domain concepts are declared **twice** — once in
[lib/types.ts](lib/types.ts) (Mongo shape) and once in
`lib/domain/entities/` (domain shape) — with overlapping but **not
identical** definitions. Two parallel hierarchies inevitably drift, and
already have:

1. **`InvoiceCounter` shape mismatch.**
   [lib/types.ts](lib/types.ts) defines it with a `year` field:

   ```ts
   export interface InvoiceCounter {
     _id?: ObjectId
     series: InvoiceType
     year: number
     lastNumber: number
     updatedAt: Date
   }
   ```

   but [lib/domain/entities/invoice.ts](lib/domain/entities/invoice.ts) is
   **missing `year`** entirely:

   ```ts
   export interface InvoiceCounter {
     _id?: string
     series: InvoiceType
     lastNumber: number
     updatedAt: Date
   }
   ```

   The port [lib/domain/ports/invoice-counter-repository.ts](lib/domain/ports/invoice-counter-repository.ts)
   and adapter both key by `(series, year)`, so the domain entity is wrong.

2. **Redundant scalar/value types.** `PaymentType`, `InvoiceType`,
   `PaymentConcept`, `InvoiceMetadata`, `PaymentFormData`,
   and `ClientFormData` are declared in **both**
   [lib/types.ts](lib/types.ts) and
   [lib/domain/entities/payment.ts](lib/domain/entities/payment.ts) /
   [lib/domain/entities/client.ts](lib/domain/entities/client.ts). These
   are pure value types with no `ObjectId` — there is no reason to maintain
   two copies.

**Suggested change:**

- Make the domain entities the single source of truth for **value types**
  (`PaymentType`, `InvoiceType`, `InvoiceMetadata`, `PaymentConcept`,
  `PaymentFormData`, `ClientFormData`, etc.). Have `lib/types.ts` *import*
  those value types from the entities and only declare the parts that
  genuinely differ — i.e. the `ObjectId`-typed identity/foreign-key fields:

  ```ts
  // lib/types.ts (persistence-only)
  import type { ObjectId } from "mongodb"
  import type {
    InvoiceMetadata,
    PaymentConcept,
    PaymentMethod,
    PaymentType,
  } from "./domain/entities/payment"

  export interface Payment {
    _id?: ObjectId
    clientId?: ObjectId
    concepts: PaymentConcept[]
    invoices?: InvoiceMetadata[]
    type: PaymentType
    // ...persistence-only differences only
  }
  ```

- Add the missing `year: number` field to the domain
  `InvoiceCounter` in [lib/domain/entities/invoice.ts](lib/domain/entities/invoice.ts)
  so it matches the port contract and persistence shape.

- The deprecated `InvoiceSeries` alias has been removed; `InvoiceType` is
  the only name used by the invoice-counter code.

---

## V3 — Infrastructure outside the adapter layer, bypassing the port — ✅ RESOLVED

**Resolution:** `lib/invoiceCounters.ts` was deleted; its
`getNextInvoiceNumber` / `getCurrentInvoiceNumber` / `initializeInvoiceCounters`
logic now lives only in
[mongo-invoice-counter-repository.ts](lib/adapters/repositories/mongo-invoice-counter-repository.ts)
(behind the `InvoiceCounterRepository` port), and
[app/api/invoices/generate/route.ts](app/api/invoices/generate/route.ts)
depends on the port rather than the free function. All `invoiceCounters`
collection access is back inside the adapter layer.

**Principle violated:** dependency inversion / ports & adapters.

[lib/invoiceCounters.ts](lib/invoiceCounters.ts) is **infrastructure code**
— it imports `getDatabase` and runs `db.collection<InvoiceCounter>(...)`
driver calls — but it lives at the top level of `lib/`, **outside**
`lib/adapters/repositories/`, and it **duplicates** the already-existing
adapter
[lib/adapters/repositories/mongo-invoice-counter-repository.ts](lib/adapters/repositories/mongo-invoice-counter-repository.ts),
which implements the
[InvoiceCounterRepository](lib/domain/ports/invoice-counter-repository.ts)
port.

`getNextInvoiceNumber` / `getCurrentInvoiceNumber` in
[lib/invoiceCounters.ts](lib/invoiceCounters.ts) are byte-for-byte
equivalent to `MongoInvoiceCounterRepository.getNextNumber` /
`getCurrentNumber`. Worse, the API route depends on the **free function**
rather than the **port**:

```ts
// app/api/invoices/generate/route.ts
import { getNextInvoiceNumber } from "@/lib/invoiceCounters"
// ...
const invoiceNumber = await getNextInvoiceNumber(type, year)
```

This is a direct dependency from the application layer onto a concrete
infrastructure function that talks to Mongo, inverting the intended
dependency direction (the route should depend on the abstraction).

**Affected files:**
- [lib/invoiceCounters.ts](lib/invoiceCounters.ts) (infra in the wrong
  layer; duplicate of the adapter)
- [app/api/invoices/generate/route.ts](app/api/invoices/generate/route.ts)
  (depends on the free function, not the port)
- The `initializeInvoiceCounters` helper (used only for setup/testing) also
  lives here and issues raw `db.collection(...).bulkWrite(...)` calls
  outside any repository.

**Suggested change:**

1. Route the API handler through the existing adapter/port, matching how the
   same file already uses `MongoPaymentRepository` and
   `MongoClientRepository`:

   ```diff
   - import { getNextInvoiceNumber } from "@/lib/invoiceCounters"
   + import { MongoInvoiceCounterRepository } from "@/lib/adapters/repositories/mongo-invoice-counter-repository"

   + const invoiceCounterRepo = new MongoInvoiceCounterRepository()
     // ...
   - const invoiceNumber = await getNextInvoiceNumber(type, year)
   + const invoiceNumber = await invoiceCounterRepo.getNextNumber(type, year)
   ```

2. Move the `initializeInvoiceCounters` setup logic into the adapter (e.g.
   an `initialize(year, startNumber)` method on
   `MongoInvoiceCounterRepository`, optionally added to the port if the app
   needs it) so all `invoiceCounters` collection access lives in one place.

3. Delete [lib/invoiceCounters.ts](lib/invoiceCounters.ts) once no
   non-test caller remains. This removes the only `db.collection(...)` usage
   outside the repository folder besides the legitimate one-off migration
   script.

---

## V4 — Redundant, duplicated (and inconsistent) `ObjectId` coercion helpers — ✅ RESOLVED

**Resolution:** a single, validated coercion pair now lives in
[lib/adapters/repositories/mongo-utils.ts](lib/adapters/repositories/mongo-utils.ts)
— `isValidObjectId(id)` (wrapping `ObjectId.isValid`) and `toObjectId(id)`
(wrapping `new ObjectId`). The four duplicated per-repository `toObjectId`
copies were removed: the client, payment, and absence repositories now import
both helpers from `./mongo-utils`, and
[mongo-event-repository-helpers.ts](lib/adapters/repositories/mongo-event-repository-helpers.ts)
re-exports them from the same module so existing event-repository imports and
tests keep working. Every id-keyed method across the client, payment, and
absence repositories (`findById`, `update`, `delete`, plus payment's
`appendInvoice` / `removeLinkInvoice`) now guards with `isValidObjectId` and
returns a clean `null`/`false` for malformed ids — matching the event
repository — so a bad id no longer throws a `BSONError` at the driver. Valid
ids behave identically. Unit coverage for the helpers was added to
[mongo-utils.test.ts](lib/adapters/repositories/mongo-utils.test.ts).

**Principle violated:** separation of concerns / DRY at the boundary.

The `string` → `ObjectId` coercion is re-implemented **independently in
four places**, and they are **not consistent** — only the event helper
validates the input before constructing an `ObjectId`:

- [lib/adapters/repositories/mongo-client-repository.ts](lib/adapters/repositories/mongo-client-repository.ts)
  `function toObjectId(id) { return new ObjectId(id) }` — **no validation**
- [lib/adapters/repositories/mongo-payment-repository.ts](lib/adapters/repositories/mongo-payment-repository.ts)
  `function toObjectId(id) { return new ObjectId(id) }` — **no validation**
- [lib/adapters/repositories/mongo-absence-repository.ts](lib/adapters/repositories/mongo-absence-repository.ts)
  `function toObjectId(id) { return new ObjectId(id) }` — **no validation**
- [lib/adapters/repositories/mongo-event-repository-helpers.ts](lib/adapters/repositories/mongo-event-repository-helpers.ts)
  exports both `toObjectId(id)` **and** `isValidObjectId(id)`; the event
  repository guards every call with `isValidObjectId` first.

The repository guidelines explicitly require validating with
`ObjectId.isValid(id)` **before** `new ObjectId(id)` to avoid driver throws
(see [lib/adapters/repositories/AGENTS.md](lib/adapters/repositories/AGENTS.md)).
The client/payment/absence repos skip this, so a malformed `id` reaching
`findById`/`update`/`delete` throws a `BSONError` instead of returning a
clean `null`/`false`. The event repository gets it right — proving the
inconsistency is accidental drift, not intent.

**Suggested change:** promote a single, validated coercion helper into the
shared [lib/adapters/repositories/mongo-utils.ts](lib/adapters/repositories/mongo-utils.ts)
and have all repositories use it:

```ts
// lib/adapters/repositories/mongo-utils.ts
import { ObjectId } from "mongodb"

export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id)
}

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
}
```

Then delete the four local copies and import from `./mongo-utils`, and add
`isValidObjectId` guards (returning `null`/`false`) to the
client/payment/absence repositories' id-keyed methods, matching the event
repository. The `mongo-event-repository-helpers.ts` versions can re-export
from `mongo-utils` to avoid breaking existing imports/tests.

---

## Verified non-violations

These were checked and are **clean** — calling them out to avoid
unnecessary churn:

- **Repositories convert at the boundary.** Every adapter imports the
  domain entity for its public types and the Mongo shape only internally
  (`import { Payment as MongoPayment } from "../../types"`), mapping `_id`
  and FK fields via `.toString()` in `toDomain`. See
  [mongo-payment-repository.ts](lib/adapters/repositories/mongo-payment-repository.ts)
  and [mongo-client-repository.ts](lib/adapters/repositories/mongo-client-repository.ts).
- **API routes don't touch `ObjectId`.** No route under `app/api/`
  imports `mongodb` or constructs an `ObjectId`; IDs flow as strings and
  coercion happens inside the repositories. (The only `app/` matches for
  "ObjectId" are documentation strings in `README.md` and validation
  tests.)
- **`mongodb` driver imports are confined** to
  [lib/mongodb.ts](lib/mongodb.ts), the repository adapters, and
  [lib/adapters/repositories/ensure-indexes.ts](lib/adapters/repositories/ensure-indexes.ts)
  — all legitimately inside the infrastructure layer.
- **Index bootstrap is centralised** via `ensureIndexesOnce` /
  `INDEX_SPECS`, not created ad-hoc inside repository methods.
- **Domain services and validators** (Zod schemas, calculators) contain no
  persistence concerns and operate on domain types.
- **The migration script** [scripts/absences/migrateBackfillPartOfDay.ts](scripts/absences/migrateBackfillPartOfDay.ts)
  uses `db.collection(...)` directly, but it is an out-of-band one-off
  maintenance script (host layer), not application/runtime code — an
  acceptable exception, though it could also be expressed as a repository
  method if reuse is expected.

---

## Suggested remediation order

1. **V2 + V1 together:** make domain entities the single source of truth for
   value types, add the missing `InvoiceCounter.year`, then repoint all
   non-repository imports from `@/lib/types` to `lib/domain/entities/*`.
   Rename the persistence interfaces to `MongoX` to make future leaks
   self-evident.
2. **V4:** centralise `toObjectId` / `isValidObjectId` in `mongo-utils.ts`
   and add the missing validation guards to the client/payment/absence
   repositories.
3. **V3:** switch [app/api/invoices/generate/route.ts](app/api/invoices/generate/route.ts)
   to the `InvoiceCounterRepository` port, fold `initializeInvoiceCounters`
   into the adapter, and delete [lib/invoiceCounters.ts](lib/invoiceCounters.ts).

Each step is independently shippable and keeps `bun run lint`,
`bun test`, and `bun run build` green.
