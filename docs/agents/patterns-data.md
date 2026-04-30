# Data & API Patterns

## Payment Entity Structure

### Type Definitions (lib/types.ts)

```typescript
export type PaymentType = "income" | "outcome";

export interface PaymentConcept {
  name?: string;           // Optional name/description (e.g., "Consulting", "Materials")
  amount: number;          // Amount in euros for this concept/line item
  vat?: number;           // Optional concept-level VAT override (as percentage)
}

export interface Payment {
  _id?: ObjectId;
  type: PaymentType;
  date: string;           // ISO date YYYY-MM-DD
  tag?: string;          // Optional category tag
  concepts: PaymentConcept[]; // Array of payment components
  vat: number;           // Default VAT percentage (0-100)
  netAmount: number;     // Calculated: total / (1 + vat/100)
  vatAmount: number;     // Calculated: total - netAmount
  total: number;         // Calculated: sum of all concept amounts
  createdAt: Date;
  updatedAt: Date;
}
```

### Key Concepts Pattern
- **Concepts**: A payment is composed of one or more concepts (line items)
- **Flexible Naming**: Each concept can optionally have a descriptive name
- **Total Calculation**: `total = sum(concept.amount for all concepts)`
- **VAT Application**: Applied at payment level to total amount; concepts inherit default VAT unless overridden
- **Calculated Fields**: `netAmount`, `vatAmount`, `total` are computed server-side

## Database Operations
- Use getDatabase(); typed collections db.collection<Payment>("payments")
- Common ops: find/insertOne/updateOne/deleteOne; sort by date desc
- Calculations: Always recompute net/vat on create/update based on concepts

## Validation

### Server Validation (API Routes)
- **Required**: type, date, concepts[] (at least one), vat
- **Concepts**: Each must have amount (number); name is optional string
- **Numeric**: Parse amounts with parseFloat(); check !isNaN
- **VAT Range**: Must be 0-100; reject if outside range
- **Concept Amounts**: Reject if any amount is NaN
- **Legacy Support**: Single `total` field converts to single unnamed concept for backward compatibility

### Client Validation (PaymentForm)
- Use HTML required/type="number"/step="0.01" attributes
- Disable submit during processing (isSubmitting state)
- Validate at least one concept has amount > 0 before submit
- Show error messages for API failures

### Calculation Rules
- **Total**: `total = sum(concept.amount)`
- **Net**: `netAmount = total / (1 + vat%/100)`
- **VAT Amount**: `vatAmount = total - netAmount`
- All calculations done server-side on create/update

## API Patterns

### POST /api/payments
**Request with Multiple Concepts:**
```json
{
  "type": "income",
  "date": "2024-01-15",
  "concepts": [
    { "name": "Service A", "amount": 100.00 },
    { "name": "Service B", "amount": 200.00 }
  ],
  "vat": "21",
  "tag": "Client X"
}
```
- Validates all concepts have amounts
- Calculates total, net, vat amounts server-side
- Returns insertedId on success

### PUT /api/payments
**Update Concepts:**
```json
{
  "id": "ObjectId",
  "concepts": [{ "name": "Updated Item", "amount": 250.00 }],
  "vat": "21"
}
```
- Can update concepts, vat, date, type, tag independently
- Recalculates totals when concepts or vat change
- Returns updated total/vat/netAmount for optimistic updates

### GET /api/payments
- Returns full Payment objects with all calculated fields
- Concepts array included in response
- Sorted by date descending

## Error Handling
- Wrap DB ops in try/catch
- Log with template literals; return friendly JSON error
- Use proper status codes (400 validation, 404 not found, 500 server)
- Validate concept amounts are numbers (isNaN checks)

## Environment
- MONGODB_URI required (.env.local for dev)

## Performance
- Typed queries; avoid extra libs; no external UI kits
- Mongo connection singleton
- Calculations in-memory (no DB aggregation for now)

## Security
- Validate all user input server-side
- Validate vat percentage range
- Parse amounts safely with parseFloat
- Mongo driver mitigates injection; keep env vars server-side
