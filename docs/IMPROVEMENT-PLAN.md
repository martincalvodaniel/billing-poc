# Billing POC — Architecture Improvement Plan

## Status: ✅ COMPLETED

## Overview
Full hexagonal architecture refactor: domain layer, adapters, Zod validation, DRY utilities, comprehensive tests.

### Results
- **99 tests** across 6 files — all passing
- **0 lint errors** (Biome, 72 files)
- **Build successful** (Next.js static generation)
- API routes reduced from ~850 lines to ~330 lines total
- Eliminated all code duplication (formatters, colors, toast, zodError, calculations)

## Execution Order
1. **Phase 1** (Domain Layer) — sequential
2. **Phase 2** (Adapters) — sequential, depends on Phase 1
3. **Phase 3** (API Refactor) — sequential, depends on Phase 2
4. **Phases 4+5+7** (Server Components + DRY + Polish) — parallel after Phase 3
5. **Phase 6** (Tests) — last, after all code changes

---

## Phase 1 — Domain Layer (Hexagonal Core)

### New files
- `lib/domain/entities/payment.ts` — Payment, PaymentConcept, PaymentType (pure TS, no MongoDB deps)
- `lib/domain/entities/client.ts` — Client, ClientType, ClientFormData
- `lib/domain/entities/invoice.ts` — Invoice, InvoiceSeries, InvoiceCounter
- `lib/domain/services/payment-calculator.ts` — calculateTotal, Net, VAT, Surcharge (moved from paymentUtils.ts)
- `lib/domain/services/payment-validator.ts` — Zod schema + validatePaymentInput()
- `lib/domain/services/client-validator.ts` — Zod schema + validateClientInput()
- `lib/domain/ports/payment-repository.ts` — PaymentRepository interface
- `lib/domain/ports/client-repository.ts` — ClientRepository interface
- `lib/domain/ports/invoice-counter-repository.ts` — InvoiceCounterRepository interface
- `lib/domain/ports/storage-port.ts` — BlobStorage interface

### Modified files
- `lib/types.ts` — becomes barrel re-export from domain/entities
- `app/month/components/paymentUtils.ts` — re-exports from domain/services/payment-calculator.ts
- `app/month/components/paymentUtils.test.ts` — update imports

### Key decisions
- Domain entities have NO ObjectId — they use `id?: string`
- ObjectId conversion happens only in adapters
- `calculateNetAmount` return type fixed: `number` instead of `string`
- Zod schemas define validation + provide TypeScript types

---

## Phase 2 — Adapters (Infrastructure)

### New files
- `lib/adapters/repositories/mongo-payment-repository.ts`
- `lib/adapters/repositories/mongo-client-repository.ts`
- `lib/adapters/repositories/mongo-invoice-counter-repository.ts`
- `lib/adapters/storage/vercel-blob-storage.ts`

### Each adapter
- Implements the port interface from Phase 1
- Converts between domain entities (string IDs) and MongoDB documents (ObjectId)
- Encapsulates all MongoDB query building ($regex, $gte, $set, etc.)

---

## Phase 3 — API Routes Refactor

### Modified files
- `app/api/payments/route.ts` — 550 lines → ~120 lines (delegate to services + repositories)
- `app/api/clients/route.ts` — 200 lines → ~80 lines
- `app/api/tags/route.ts` — simplify with repository
- `app/api/invoices/generate/route.ts` — delegate to invoice service
- `app/api/invoices/upload/route.ts` — delegate to storage adapter
- `app/api/invoices/[id]/route.ts` — delegate to storage adapter

### Pattern
```
parse request → validate with Zod → call service/repository → return NextResponse.json
```

---

## Phase 4 — Server Components

### Modified files
- `app/year/page.tsx` — remove "use client", fetch data server-side, pass to new YearContent client component
- `app/clients/page.tsx` — remove "use client", fetch initial page server-side, pass to ClientsContent
- `app/year/components/YearContent.tsx` — NEW, client component with interactivity
- `app/clients/components/ClientsContent.tsx` — NEW, client component with interactivity

---

## Phase 5 — DRY & Shared Utilities

### New files
- `lib/formatters.ts` — formatCurrency(), formatDate(), formatMonthYear()
- `lib/constants.ts` — CHART_COLORS array
- `app/components/Toast.tsx` — shared success/error toast

### Modified files
- Remove `formatCurrency` from year/page.tsx, MonthlyPaymentsView.tsx, PaymentDetailModal.tsx
- Remove duplicate colors arrays
- Replace inline toast JSX with `<Toast>` component
- Remove redundant keyboard handlers in ClientList.tsx (Modal already handles ESC)
- Remove identity `useMemo` in year/page.tsx (paymentsForYear)
- Remove wrapper `getFilteredPayments()` in MonthlyPaymentsView.tsx

---

## Phase 6 — Tests

### New test files
- `lib/domain/services/payment-calculator.test.ts` — moved from paymentUtils.test.ts
- `lib/domain/services/payment-validator.test.ts` — Zod schema tests
- `lib/domain/services/client-validator.test.ts` — Zod schema tests
- `lib/adapters/repositories/mongo-payment-repository.test.ts` — with mock DB
- `lib/adapters/repositories/mongo-client-repository.test.ts` — with mock DB

---

## Phase 7 — Minor Fixes & Polish

- PaymentForm: replace `document.querySelector` with `useRef` for form submission
- usePaymentForm: reduce tag debounce from 1000ms to 300ms
- lib/mongodb.ts: use `process.env.MONGODB_DB || "billing-poc"` for database name
- ClientSelector: add dedicated client-by-ID lookup instead of fetching all clients
- Env validation: check BLOB_READ_WRITE_TOKEN at startup
