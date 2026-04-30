# Data & API Patterns

## Payment Entity Structure

### Type Definitions (lib/types.ts)

```typescript
export type PaymentType = "income" | "outcome";

export interface PaymentConcept {
  name: string;            // Required name/description (e.g., "Consulting", "Materials")
  amount: number;          // Amount in euros per unit for this concept/line item
  quantity: number;        // Quantity multiplier (1 or more); defaults to 1 if omitted
}

export interface Payment {
  _id?: ObjectId;
  type: PaymentType;
  date: string;           // ISO date YYYY-MM-DD
  tag?: string;          // Optional category tag
  concepts: PaymentConcept[]; // Array of payment components
  vat: number;           // VAT percentage applied uniformly (0-100)
  netAmount: number;     // Calculated: total / (1 + vat/100)
  vatAmount: number;     // Calculated: total - netAmount
  total: number;         // Calculated: sum of (concept.amount * concept.quantity) for all concepts
  createdAt: Date;
  updatedAt: Date;
}
```

### Key Concepts Pattern
- **Concepts**: A payment is composed of one or more concepts (line items)
- **Required Naming**: Each concept must have a descriptive name
- **Quantity Support**: Each concept has a quantity multiplier (default 1)
- **Total Calculation**: `total = sum(concept.amount * concept.quantity for all concepts)`
- **VAT Application**: Applied uniformly at payment level to total amount; no concept-level overrides
- **Calculated Fields**: `netAmount`, `vatAmount`, `total` are computed server-side

## Client Entity Structure

### Type Definitions (lib/types.ts)

```typescript
export type ClientType = "individual" | "company";

export interface Client {
  _id?: ObjectId;
  clientType: ClientType;  // "individual" for persons/freelancers, "company" for businesses
  name: string;            // Full name (individual) or Business name (company)
  taxId: string;           // NIF/CIF/NIE (Tax identification number)
  address: string;         // Domicilio Fiscal (full address with CP and city)
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientFormData {
  clientType: ClientType;
  name: string;
  taxId: string;
  address: string;
}
```

### Client Entity Pattern
- **Client Types**: Distinguish between individual persons/freelancers and business entities
- **Tax ID**: Required field for all clients (NIF for individuals, CIF for companies, NIE for foreigners)
- **Name**: Full name for individuals or business/company name (Razón Social) for companies
- **Address**: Complete tax address including postal code and city (Domicilio Fiscal)
- **Timestamp Tracking**: Each client tracks creation and last update time for audit purposes

## Database Operations
- Use getDatabase(); typed collections db.collection<Payment>("payments") and db.collection<Client>("clients")
- Common ops: find/insertOne/updateOne/deleteOne; sort by date desc (payments), sort by name asc (clients)
- Calculations: Always recompute net/vat on create/update based on concepts

## Validation

### Server Validation (API Routes)

#### Payment Validation
- **Required**: type, date, concepts[] (at least one), vat
- **Concepts**: Each must have name (non-empty string) and amount (number); quantity defaults to 1 if omitted
- **Numeric**: Parse amounts and quantities with parseFloat(); check !isNaN
- **VAT Range**: Must be 0-100; reject if outside range
- **Concept Names**: Reject if any name is missing or empty string
- **Concept Amounts**: Reject if any amount is NaN
- **Legacy Support**: Single `total` field converts to single unnamed concept for backward compatibility (deprecated)

#### Client Validation
- **Required**: clientType, name, taxId, address (all fields required on create)
- **Client Type**: Must be either "individual" or "company"
- **Field Validation**: All fields must be non-empty strings (after trim)
- **Optional on Update**: Any field can be updated individually; at least one field required to avoid no-op updates

### Client Validation (ClientForm)
- Use HTML required attributes on all form fields
- Validate on submit before API call
- Show field-specific error messages
- Disable submit button while processing

### Payment Validation (PaymentForm)
- Use HTML required/type="number"/step="0.01" attributes
- All concept name fields are required; show validation error if empty
- Disable submit during processing (isSubmitting state)
- Validate all concepts have names and at least one concept has amount > 0
- Show error messages for API failures

### Calculation Rules
- **Total**: `total = sum(concept.amount * concept.quantity)` for all concepts
- **Net**: `netAmount = total / (1 + vat%/100)`
- **VAT Amount**: `vatAmount = total - netAmount`
- All calculations done server-side on create/update

## API Patterns

### Fetching Payments with Year/Month Filtering (Performance Optimization)

For large datasets, use query parameters to filter at the database level rather than fetching all payments client-side.

**API Endpoint:**
```typescript
// GET /api/payments?year={year}&month={month}
// year: required if month is used; optional standalone
// month: 1-12 optional; requires year parameter
```

**Implementation in GET /api/payments:**
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  let filter: Record<string, unknown> = {};
  
  if (year && month) {
    // Filter by specific month: create date range for that month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    
    filter.date = {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0],
    };
  } else if (year) {
    // Filter by year: create date range for that year
    const yearNum = parseInt(year);
    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
    
    filter.date = {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0],
    };
  }

  const payments = await db
    .collection<Payment>("payments")
    .find(filter)
    .sort({ date: -1, createdAt: -1 })
    .toArray();

  return NextResponse.json({ payments }, { status: 200 });
}
```

**Client-Side Usage:**
```typescript
// Fetch payments for a specific month
const year = selectedDate.getFullYear();
const month = selectedDate.getMonth() + 1;
const response = await fetch(`/api/payments?year=${year}&month=${month}`);
const data = await response.json();

// No client-side filtering needed since API returns only relevant month's payments
const filteredPayments = data.payments; // Already filtered by server
```

**Benefits:**
- ✅ Only relevant data fetched from database (not all payments)
- ✅ Scales well as database grows (database can index date field)
- ✅ Reduces payload size over network
- ✅ Eliminates client-side filtering overhead
- ✅ Backward compatible (no params = all payments)

**Edge Cases:**
- Invalid month (not 1-12): Returns 400 error
- Invalid year (non-numeric): Returns 400 error  
- Month without year: Month parameter is ignored

### Fetching Clients with Search Filtering

Use search query parameter to filter clients at database level by name or tax ID. Results are limited to 10 clients maximum to avoid loading all clients into memory.

**API Endpoint:**
```typescript
// GET /api/clients?search={searchTerm}
// search: optional search term (case-insensitive, searches name and taxId)
// Returns maximum 10 clients sorted by name (limit applied server-side)
```

**Implementation in GET /api/clients:**
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let filter: Record<string, unknown> = {};

  if (search && search.trim()) {
    // Search by name or taxId (case-insensitive)
    const searchPattern = { $regex: search.trim(), $options: "i" };
    filter.$or = [
      { name: searchPattern },
      { taxId: searchPattern },
    ];
  }

  const clients = await db
    .collection<Client>("clients")
    .find(filter)
    .sort({ name: 1 })
    .limit(10)         // Limit to 10 clients to prevent memory overhead
    .toArray();

  return NextResponse.json({ clients }, { status: 200 });
}
```

**Client-Side Usage:**
```typescript
// Fetch clients matching search term (limited to 10 results)
const searchTerm = "John";
const response = await fetch(`/api/clients?search=${encodeURIComponent(searchTerm)}`);
const data = await response.json();
const filteredClients = data.clients; // Already filtered and limited by server (sorted by name, max 10)
```

**Benefits:**
- ✅ Case-insensitive search across name and tax ID
- ✅ Returns clients sorted by name
- ✅ Filters at database level for performance
- ✅ Limits to 10 results to prevent loading unnecessary data into memory
- ✅ Refine search term to narrow results when more than 10 matches exist
- ✅ No search results returns empty array (not an error)

### POST /api/payments
**Request with Multiple Concepts:**
```json
{
  "type": "income",
  "date": "2024-01-15",
  "concepts": [
    { "name": "Service A", "amount": 100.00, "quantity": 1 },
    { "name": "Service B", "amount": 50.00, "quantity": 4 }
  ],
  "vat": "21",
  "tag": "Client X"
}
```
- Validates all concepts have amounts; quantity defaults to 1 if omitted
- Calculates total: (100 × 1) + (50 × 4) = 300
- Calculates net and vat amounts server-side
- Returns insertedId on success

### PUT /api/payments
**Update Concepts:**
```json
{
  "id": "ObjectId",
  "concepts": [{ "name": "Updated Item", "amount": 125.00, "quantity": 2 }],
  "vat": "21"
}
```
- Can update concepts, vat, date, type, tag independently
- Recalculates totals when concepts or vat change (total = 125 × 2 = 250)
- Returns updated total/vat/netAmount for optimistic updates

### GET /api/payments
- Returns full Payment objects with all calculated fields
- Concepts array included in response
- Sorted by date descending

### POST /api/clients
**Request:**
```json
{
  "clientType": "individual",
  "name": "John Doe",
  "taxId": "12345678A",
  "address": "Calle Principal 123, 28001 Madrid"
}
```
- All fields required
- Trims whitespace from string fields
- Returns insertedId on success

### PUT /api/clients
**Update Client:**
```json
{
  "id": "ObjectId",
  "name": "Jane Doe",
  "taxId": "87654321B"
}
```
- Can update any field individually
- At least one field required (other than updatedAt)
- Validates field values before update

### GET /api/clients
- Returns all clients sorted by name ascending
- Optional search parameter filters by name or taxId (case-insensitive)
- Clients array in response

### DELETE /api/clients
- Requires client ID
- Returns success on deletion

## Error Handling
- Wrap DB ops in try/catch
- Log with template literals; return friendly JSON error
- Use proper status codes (400 validation, 404 not found, 500 server)
- Validate concept amounts are numbers (isNaN checks)
- For clients, validate string fields are not empty after trim

## Environment
- MONGODB_URI required (.env.local for dev)

## Performance
- Typed queries; avoid extra libs; no external UI kits
- Mongo connection singleton
- Calculations in-memory (no DB aggregation for now)
- Search filtering at database level using regex patterns

## Security
- Validate all user input server-side
- Validate vat percentage range
- Parse amounts safely with parseFloat
- Trim string fields to prevent leading/trailing whitespace attacks
- Mongo driver mitigates injection; keep env vars server-side
