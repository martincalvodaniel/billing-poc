# API Routes — Patterns & Conventions

## Architecture — Hexagonal Pattern
API routes are thin handlers that delegate to domain services and repository adapters:
```
authenticate → parse request → validate with Zod → call repository/service → return NextResponse.json
```

## Authentication Guard
Every API route handler (except `/api/auth/`) must call `requireAuth()` as the first line inside the `try` block:
```ts
import { requireAuth } from "@/lib/auth/require-auth"

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAuth()
    if (denied) return denied
    // ... rest of handler
  }
}
```
Never add auth checks to `src/app/api/auth/[...all]/route.ts`.

## Route Structure
Each resource has `src/app/api/[resource]/route.ts` exporting GET, POST, PUT, DELETE handlers.

## Validation — Zod Schemas
- Payment validation: `src/lib/domain/services/payment-validator.ts` (createPaymentSchema, updatePaymentSchema, etc.)
- Client validation: `src/lib/domain/services/client-validator.ts` (createClientSchema, updateClientSchema, etc.)
- Use `schema.safeParse(data)` and `zodError(parsed.error)` from `lib/validation.ts` for error messages
- Never do manual field-by-field validation — always use Zod schemas

## Repository Adapters
- `MongoPaymentRepository` (`src/lib/db/repositories/mongo-payment-repository.ts`)
- `MongoClientRepository` (`src/lib/db/repositories/mongo-client-repository.ts`)
- `MongoInvoiceCounterRepository` (`src/lib/db/repositories/mongo-invoice-counter-repository.ts`)
- Instantiate at module scope: `const payments = new MongoPaymentRepository()`
- Never use raw `getDatabase()` or `db.collection()` directly in API routes

## Server-Side Calculations (Payments)
Use `computePaymentFinancials(concepts, vat, surcharge)` from `src/lib/domain/services/payment-calculator.ts`:
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
- PDFs via `pdf-lib`, regenerated server-side from invoice metadata when requested
- Outcome payments: upload provider bill PDFs (max 10MB)
