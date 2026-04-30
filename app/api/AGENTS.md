# API Routes — Patterns & Conventions

## Route Structure
Each resource has `app/api/[resource]/route.ts` exporting GET, POST, PUT, DELETE handlers.

## Request Handling
- Parse query params with `request.nextUrl.searchParams`
- Parse body with `await request.json()`
- Numeric strings: `parseFloat(value)` + `Number.isNaN()` guard
- Return `NextResponse.json({ data }, { status })` with correct HTTP status codes

## Validation
- Required fields: check presence and return 400 with descriptive error
- Concepts: array must be non-empty, each concept needs non-empty `name`, valid numeric `amount`
- Ranges: VAT 0–100, surcharge 0–100, dates in ISO YYYY-MM-DD
- Client references: verify `clientId` exists in clients collection before linking

## Database Operations
- Get connection: `const db = await getDatabase()` (singleton from `lib/mongodb.ts`)
- Typed collections: `db.collection<Payment>("payments")`, `db.collection<Client>("clients")`
- Sort payments by `date: -1, createdAt: -1`; clients by `name: 1`
- Search: case-insensitive `$regex` with `$options: "i"`
- Pagination: `skip((page - 1) * pageSize).limit(pageSize)` with `countDocuments()` for totals

## Server-Side Calculations (Payments)
All financial fields computed on the server, never trusted from client:
- `total = Σ(concept.amount × concept.quantity)`
- `netAmount = total / (1 + vat/100 + surcharge/100)`
- `vatAmount = total × (vat/100) / (1 + vat/100 + surcharge/100)`
- `surchargeAmount` (when surcharge > 0): same formula with surcharge%

## Error Pattern
```ts
return NextResponse.json({ error: "Descriptive message" }, { status: 400 })
```
Log errors with template literals: `console.error(\`Error context: ${error}\`)`

## Invoice Generation
- Income payments only; 4 independent series with atomic MongoDB counters (`findOneAndUpdate` + upsert)
- PDFs via `pdf-lib`, stored in Vercel Blob, served through server-side proxy
- Outcome payments: upload provider bill PDFs (max 10MB)
