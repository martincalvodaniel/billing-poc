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
  clientId?: ObjectId;    // Optional associated client
  concepts: PaymentConcept[]; // Array of payment components
  vat: number;           // VAT percentage applied uniformly (0-100)
  surcharge?: number;      // Optional surcharge percentage (0-100)
  deliveryNoteRef?: string;  // Optional reference identifier for a delivery note
  netAmount: number;     // Calculated: total / (1 + vat/100 + surcharge/100)
  vatAmount: number;     // Calculated: total * (vat/100) / (1 + vat/100 + surcharge/100)
  surchargeAmount?: number; // Calculated: total * (surcharge/100) / (1 + vat/100 + surcharge/100) when surcharge > 0
  total: number;         // Calculated: sum of (concept.amount * concept.quantity) for all concepts
  invoice?: InvoiceMetadata; // Generated invoice (for income payments only)
  providerBillUrl?: string;  // Uploaded provider bill URL (for outcome payments only)
  providerBillPathname?: string; // Uploaded provider bill storage path
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceCounter {
  _id?: ObjectId;
  series: InvoiceSeries;     // Invoice series name
  lastNumber: number;         // Last used sequential number
  updatedAt: Date;
}
```

### Key Concepts Pattern
- **Concepts**: A payment is composed of one or more concepts (line items)
- **Required Naming**: Each concept must have a descriptive name
- **Quantity Support**: Each concept has a quantity multiplier (default 1)
- **Total Calculation**: `total = sum(concept.amount * concept.quantity for all concepts)`
- **VAT Application**: Applied uniformly at payment level to total amount; no concept-level overrides
- **Surcharge**: Optional secondary percentage for freelancers (e.g., 5.2%). Applied uniformly at payment level alongside VAT.
- **Calculated Fields**: `netAmount`, `vatAmount`, `surchargeAmount`, `total` are computed server-side

### Invoice Generation Pattern
- **Income Only**: Only income payments can have generated invoices
- **Outcome Only**: Only outcome payments can have uploaded provider bills
- **Sequential Numbering**: Each of 4 series maintains independent sequential numbers
  - Invoice: Standard invoices (e.g., Invoice-000001)
  - RectificativeInvoice: Corrective invoices for errors (e.g., RectificativeInvoice-000001)
  - SimpleInvoice: Simplified invoices (e.g., SimpleInvoice-000001)
  - RectificativeSimpleInvoice: Corrective simplified invoices (e.g., RectificativeSimpleInvoice-000001)
- **One Per Payment**: Each payment can have only one generated invoice or one uploaded provider bill
- **PDF Generation**: Server-side PDF generation with PDFKit; includes all payment details, line items, tax breakdown, and client info
- **Storage**: PDFs stored in Vercel Blob with public URLs for download
- **Atomic Counters**: MongoDB findOneAndUpdate with upsert ensures no duplicate invoice numbers within a series

## Client Entity Structure

### Type Definitions (lib/types.ts)

```typescript
export type ClientType = "individual" | "company";

export interface Client {
  _id?: ObjectId;
  clientType: ClientType;  // "individual" for persons/freelancers, "company" for businesses
  name: string;            // Full name (individual) or Business name (company)
  taxId: string;           // NIF/CIF/NIE (Tax identification number)
  address: string;         // Registered address (full address with postal code and city)
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
- **Name**: Full name for individuals or legal business name for companies
- **Address**: Complete registered address including postal code and city
- **Timestamp Tracking**: Each client tracks creation and last update time for audit purposes

## Database Operations
- Use getDatabase(); typed collections db.collection<Payment>("payments") and db.collection<Client>("clients")
- Common ops: find/insertOne/updateOne/deleteOne; sort by date desc (payments), sort by name asc (clients)
- Calculations: Always recompute net/vat/surcharge on create/update based on concepts

## Validation

### Server Validation (API Routes)

#### Payment Validation
- **Required**: type, date, concepts[] (at least one), vat
- **Optional**: surcharge (surcharge percentage)
- **Concepts**: Each must have name (non-empty string) and amount (number); quantity defaults to 1 if omitted
- **Numeric**: Parse amounts and quantities with parseFloat(); check !isNaN
- **VAT Range**: Must be 0-100; reject if outside range
- **Surcharge Range**: Must be 0-100; reject if outside range (when provided)
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
- **Net (with surcharge)**: `netAmount = total / (1 + vat%/100 + surcharge%/100)`
- **VAT Amount (with surcharge)**: `vatAmount = total * (vat%/100) / (1 + vat%/100 + surcharge%/100)`
- **Surcharge Amount**: `surchargeAmount = total * (surcharge%/100) / (1 + vat%/100 + surcharge%/100)` (when surcharge > 0)
- **Net (without surcharge)**: `netAmount = total / (1 + vat%/100)`
- **VAT Amount (without surcharge)**: `vatAmount = total - netAmount`
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

### GET /api/clients with Pagination

Fetch clients with full pagination support. Results are paginated with configurable page size (default 10).

**API Endpoint:**
```typescript
// GET /api/clients?search={searchTerm}&page={pageNum}&pageSize={size}
// search: optional search term (case-insensitive, searches name and taxId)
// page: optional page number (default 1, min 1)
// pageSize: optional results per page (default 10, max 100)
// Returns paginated clients sorted by name with pagination metadata
```

**Response Format:**
```typescript
export interface PaginationMeta {
  page: number;              // Current page number
  pageSize: number;          // Number of items per page
  total: number;             // Total matching items
  totalPages: number;        // Total pages available
  hasNextPage: boolean;      // Whether next page exists
  hasPrevPage: boolean;      // Whether previous page exists
}

export interface PaginatedResponse<T> {
  items: T[];                // Array of clients for current page
  pagination: PaginationMeta; // Pagination metadata
}
```

**Example Response:**
```json
{
  "items": [
    {
      "_id": "ObjectId",
      "clientType": "individual",
      "name": "Client 1",
      "taxId": "12345678A",
      "address": "Address 1",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Implementation in GET /api/clients:**
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  // Parse pagination parameters with defaults and bounds
  const pageSize = pageSizeParam ? Math.max(1, Math.min(100, parseInt(pageSizeParam, 10))) : 10;
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const skip = (page - 1) * pageSize;

  const db = await getDatabase();
  const filter: Record<string, unknown> = {};

  // Build search filter if provided
  if (search && search.trim()) {
    const searchPattern = { $regex: search.trim(), $options: "i" };
    filter.$or = [
      { name: searchPattern },
      { taxId: searchPattern },
    ];
  }

  const collection = db.collection<Client>("clients");
  const total = await collection.countDocuments(filter);

  const clients = await collection
    .find(filter)
    .sort({ name: 1 })
    .skip(skip)
    .limit(pageSize)
    .toArray();

  const totalPages = Math.ceil(total / pageSize);

  const response: PaginatedResponse<Client> = {
    items: clients,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };

  return NextResponse.json(response, { status: 200 });
}
```

**Client-Side Usage:**
```typescript
// Fetch first page of clients (10 items default)
const response = await fetch("/api/clients");
const data = await response.json();
const clients = data.items;
const pagination = data.pagination;

// Handle pagination state
const [currentPage, setCurrentPage] = useState(pagination.page);

// Navigate to next page (if available)
const handleNextPage = async () => {
  if (pagination.hasNextPage) {
    const response = await fetch(`/api/clients?page=${currentPage + 1}`);
    const data = await response.json();
    setCurrentPage(data.pagination.page);
  }
};

// Fetch specific page with search
const handleSearch = async (searchTerm: string, pageNum: number = 1) => {
  const url = new URL("/api/clients", window.location.origin);
  url.searchParams.set("search", searchTerm);
  url.searchParams.set("page", String(pageNum));
  
  const response = await fetch(url.toString());
  const data = await response.json();
  // Update UI with data.items and data.pagination
};
```

**Pagination Patterns:**
- **Default Page Size**: 10 results per page for balanced UX and performance
- **Max Page Size**: 100 items to prevent excessive database queries
- **Search + Pagination**: When search term is provided, pagination applies to filtered results
- **Reset on Search**: Navigate users to page 1 when search term changes
- **Display Info**: Show "Showing X to Y of Z items" with current page/total pages
- **Navigation Controls**: Previous/Next buttons disabled when not applicable (page 1 has no prev, last page has no next)

**Benefits:**
- ✅ Supports large client datasets without loading all records
- ✅ Works seamlessly with search filtering
- ✅ Client-side can control page size if needed (within bounds)
- ✅ Metadata allows UI to show current position and available navigation
- ✅ Scales horizontally as client count grows

### GET /api/clients (Legacy - Single Page)
- Returns all clients sorted by name ascending
- Optional search parameter filters by name or taxId (case-insensitive)
- Clients array in response
- **Note**: This endpoint should only be used when full pagination support is not required

### DELETE /api/clients
- Requires client ID
- Returns success on deletion

### POST /api/invoices/generate
**Generate Invoice PDF for Income Payment:**
```json
{
  "paymentId": "ObjectId",
  "series": "Invoice" | "RectificativeInvoice" | "SimpleInvoice" | "RectificativeSimpleInvoice"
}
```
- Only works for income payments
- Gets next sequential number for chosen series
- Generates PDF with payment details and client info
- Uploads PDF to Vercel Blob
- Updates payment with invoice metadata
- Returns invoice metadata and download URL
- Rejects if invoice already exists

### POST /api/invoices/upload
**Upload Provider Bill PDF for Outcome Payment:**
- Use `multipart/form-data` with FormData
- Fields: `file` (PDF file, max 10MB) and `paymentId` (ObjectId)
- Only works for outcome payments
- Validates file type (PDF only) and size
- Uploads to Vercel Blob
- Updates payment with bill URL
- Can be uploaded multiple times (overwrites previous)

**Client-Side Upload Pattern:**
```typescript
const handleUpload = async (file: File, paymentId: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("paymentId", paymentId);

  const response = await fetch("/api/invoices/upload", {
    method: "POST",
    body: formData, // Don't set Content-Type header - browser sets it with boundary
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error);
  }

  return await response.json(); // { success: true, billUrl, pathname }
};
```

### GET /api/invoices/[id]
**Retrieve Invoice or Provider Bill:**
- URL parameter: payment ID
- Returns invoice metadata if income payment has generated invoice
- Returns provider bill URL if outcome payment has uploaded bill
- Returns 404 if no invoice/bill exists

**Response Types:**
```typescript
// Income with invoice
{ type: "invoice", url: string, series: string, number: number, generatedAt: Date }

// Outcome with provider bill
{ type: "providerBill", url: string }
```

## Error Handling
- Wrap DB ops in try/catch
- Log with template literals; return friendly JSON error
- Use proper status codes (400 validation, 404 not found, 500 server)
- Validate concept amounts are numbers (isNaN checks)
- For clients, validate string fields are not empty after trim

## Environment
- MONGODB_URI required (.env.local for dev)
- BLOB_READ_WRITE_TOKEN required for invoice/bill PDF storage (Vercel Blob)
  - Get from Vercel dashboard: create a Blob store in project settings
  - Auto-configured when deployed to Vercel
  - For local dev: copy token from Vercel to .env.local

## Performance
- Typed queries; avoid extra libs; no external UI kits
- Mongo connection singleton
- Calculations in-memory (no DB aggregation for now)
- Search filtering at database level using regex patterns

### Data Fetching with AbortController (React Strict Mode)

React 18 Strict Mode in development intentionally double-invokes effects to help detect side effects. This causes duplicate API calls on component mount. Use AbortController to prevent duplicate requests.

**Pattern for useEffect with fetch:**
```typescript
useEffect(() => {
  const abortController = new AbortController();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/endpoint', {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      
      // Only update state if not aborted
      if (!abortController.signal.aborted) {
        setData(data);
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      
      // Handle other errors only if not aborted
      if (!abortController.signal.aborted) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
      console.error(`Error fetching data: ${err}`);
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  fetchData();

  // Cleanup: abort request if component unmounts or effect re-runs
  return () => {
    abortController.abort();
  };
}, [dependencies]);
```

**Pattern for useCallback-wrapped fetch:**
```typescript
const fetchData = useCallback(async (signal?: AbortSignal) => {
  try {
    setIsLoading(true);
    setError(null);
    
    const response = await fetch('/api/endpoint', { signal });

    if (!response.ok) {
      throw new Error("Failed to fetch");
    }

    const data = await response.json();
    if (!signal?.aborted) {
      setData(data);
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return;
    }
    if (!signal?.aborted) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
    console.error(`Error fetching data: ${err}`);
  } finally {
    if (!signal?.aborted) {
      setIsLoading(false);
    }
  }
}, [dependencies]);

useEffect(() => {
  const abortController = new AbortController();
  fetchData(abortController.signal);

  return () => {
    abortController.abort();
  };
}, [fetchData]);
```

**Key Points:**
- ✅ Pass `signal` to fetch request
- ✅ Check `signal.aborted` before setting state
- ✅ Ignore `AbortError` exceptions (expected on cleanup)
- ✅ Return cleanup function that calls `abort()`
- ✅ Prevents duplicate database queries in development
- ✅ No effect in production (Strict Mode disabled)

## Security
- Validate all user input server-side
- Validate vat percentage range
- Parse amounts safely with parseFloat
- Trim string fields to prevent leading/trailing whitespace attacks
- Mongo driver mitigates injection; keep env vars server-side
