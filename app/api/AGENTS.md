# API Routes — Patterns & Conventions

## Architecture — Hexagonal Pattern
API routes are thin handlers that delegate to domain services and repository adapters:
```
parse request → validate with Zod → call repository/service → return NextResponse.json
```

## Route Structure
Each resource has `app/api/[resource]/route.ts` exporting GET, POST, PUT, DELETE handlers.

## Validation — Zod Schemas
- Payment validation: `lib/domain/services/payment-validator.ts` (createPaymentSchema, updatePaymentSchema, etc.)
- Client validation: `lib/domain/services/client-validator.ts` (createClientSchema, updateClientSchema, etc.)
- Use `schema.safeParse(data)` and `zodError(parsed.error)` from `lib/validation.ts` for error messages
- Never do manual field-by-field validation — always use Zod schemas

## Repository Adapters
- `MongoPaymentRepository` (`lib/adapters/repositories/mongo-payment-repository.ts`)
- `MongoClientRepository` (`lib/adapters/repositories/mongo-client-repository.ts`)
- `MongoInvoiceCounterRepository` (`lib/adapters/repositories/mongo-invoice-counter-repository.ts`)
- `VercelBlobStorage` (`lib/adapters/storage/vercel-blob-storage.ts`)
- Instantiate at module scope: `const payments = new MongoPaymentRepository()`
- Never use raw `getDatabase()` or `db.collection()` directly in API routes

## Server-Side Calculations (Payments)
Use `computePaymentFinancials(concepts, vat, surcharge)` from `lib/domain/services/payment-calculator.ts`:
- Returns `{ total, netAmount, vatAmount, surchargeAmount }` in a single call
- Never compute financial fields manually in route handlers

## Error Pattern
```ts
import { zodError } from "@/lib/validation"
// ...
const parsed = schema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 })
}
```
Log errors with template literals: `console.error(\`Error context: ${error}\`)`

## Invoice Generation
- Income payments only; 4 independent series with atomic MongoDB counters (`findOneAndUpdate` + upsert)
- PDFs via `pdf-lib`, stored in Vercel Blob, served through server-side proxy
- Outcome payments: upload provider bill PDFs (max 10MB)
