# Billing POC

A proof-of-concept billing system for managing and tracking income and outcome payments with real-time visualization, built with Next.js 16, TypeScript, React 19, and MongoDB.

## Features

- **Payment Browser** - View filtered transactions in a table (day, type, tag, total, VAT, surcharge, net amount) with summary cards (total income with count, outcome with count, balance) and real-time updates
- **Payment Components** - Payments can be composed of multiple named concepts (line items). Each concept has a required name, amount, and quantity (1 or more multiplier). Quantities are multiplied by the amount to calculate the contribution of each concept to the total. The total payment is the sum of (amount × quantity) for all components. VAT and optional surcharge are applied uniformly at the payment level.
- **Month Navigation** - Dedicated filter section at the top displays the selected month and controls. Prev/Next buttons flank the calendar picker for quick single-month navigation (matching the year page pattern). Calendar picker (closes when clicking outside) with additional prev/next navigation inside, month grid, year selection, and manual year input. Quick icon button jumps to the current month and disables when already there. Add payment button positioned adjacent to the calendar for easy access. Automatically navigates to the saved payment's month after creating a new payment. Form date field syncs with calendar selection to match the viewed month
- **Payment Entry Form (Modal)** - Add payments in a centered modal launched from the monthly view header beside the calendar picker, using the same Modal component as payment editing for visual consistency. Add multiple payment components with optional names and amounts. Gross/net calculation (enter component amounts with VAT % and optional surcharge %, system calculates net) — VAT defaults to 21%. Optional surcharge field for freelancers (e.g., 5.2%). Form type and date are sticky after saving to speed up batch entry. Supports negative amounts for refunds, corrections, and chargebacks. Associate an optional client to each payment with searchable dropdown (similar to client page search). Keyboard shortcuts: **ENTER** to save, **ESC** to cancel
- **Payment Tags** - Add optional tags to categorize payments (e.g., "Client A", "Rent"). Autocomplete suggests previously used tags after 1 second of typing. Tags are filtered by payment type — income and outcome tags are separate
- **Donut Charts by Tag** - View visual breakdown of income and outcome by tag with percentage distribution. Interactive sorting controls allow sorting by percentage or name (ascending/descending). Legend positioned on the right side of the chart for better space utilization. Tags maintain consistent colors across all sorting options. Charts appear between summary cards and payment list for quick insights
- **Modal Payment Editing** - Click any payment row in the Monthly Overview to open a full edit modal with all payment fields (date, type, tag, client, payment components, VAT, surcharge). Edit payment components (add, remove, modify name/amount/quantity), change dates, types, tags, and associated clients. Input controls include tag autocomplete and client search dropdown. All related fields (net amount, VAT amount, surcharge amount, total) automatically recalculate. Keyboard shortcuts: **ESC** to close, **Click outside** to cancel
- **Delete Payments** - Remove payments with a confirmation modal that displays payment details (date, type, tag, total) before deletion to prevent accidental removal. Keyboard shortcuts: **ENTER** to confirm deletion, **ESC** to cancel
- **Yearly Overview** - Dedicated yearly page with prev/next/current year controls, inline year picker (grid + manual entry), yearly totals with payment counts, tag donuts, and monthly breakdown cards with clickable month names that navigate to the month detail view; top navigation links between Monthly Overview and Yearly Overview
- **Client Management** - Manage business contacts with full name/surname (individuals) or business name (companies), Tax ID (NIF/CIF/NIE), tax address, and optional phone and email. Search clients by name or tax ID with real-time filtering. Click any client row to edit in a centered modal. Create and delete client records. Support for both individual freelancers and company entities. Paginated client list with navigation controls. Keyboard shortcuts: **ESC** to close modals, **Click outside** to cancel.
- **Consistent Design System** - All pages follow unified layout, navigation, colors, and spacing patterns for a cohesive user experience
- **Type Safety** - Full TypeScript with strict mode throughout the codebase
- **RESTful API** - GET, POST, PUT, and DELETE endpoints for payment and client operations with support for payment components
- **Invoice Generation** - Generate professional PDF invoices for income payments with 4 sequential series (Invoice, Rectificative Invoice, Simple Invoice, Rectificative Simple Invoice). Each series maintains independent sequential numbering. PDFs are generated server-side and served through a protected route.
- **Provider Bill Management** - Associate external provider bill links for outcome payments.
- **Pagination** - Client list pagination with configurable page size and full navigation controls for browsing large datasets
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Form & Server Validation** - Client and server-side validation for data integrity
- **Accessibility Compliant** - WCAG 2.1 Level A compliant with ARIA labels, live regions, keyboard navigation, screen reader support, and keyboard shortcuts for all modal interactions (ESC to cancel/close, ENTER to confirm/save)

## Getting Started

### Prerequisites
- Node.js 20+ and bun
- MongoDB running locally or MongoDB Atlas account

### Installation

```bash
# 1. Install dependencies
bun install

# 2. Set up environment variables
# Copy .env.example to .env and configure:
# - MONGODB_URI: Your MongoDB connection string
cp .env.example .env

# 3. Start MongoDB (if using local)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 4. Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

For detailed setup instructions including MongoDB Atlas configuration and data loading, see [docs/agents/workflow.md](./docs/agents/workflow.md).

## Development

For detailed development guidelines, code patterns, TypeScript conventions, and architectural patterns, see the modular documentation in [AGENTS.md](./AGENTS.md) (loads only relevant docs per task for efficient AI context).

## API Endpoints

### `POST /api/payments` - Create Payment

```json
{
  "type": "income" | "outcome",
  "date": "YYYY-MM-DD",
  "concepts": [
    { "name": "Service A", "amount": 150.00, "quantity": 1 },
    { "name": "Service B", "amount": 130.24, "quantity": 2 }
  ],
  "vat": "21",
  "surcharge": "5.2",
  "tag": "Client A",
  "clientId": "optional_client_object_id",
  "deliveryNoteRef": "DN-2024-001"
}
```

**Parameters:**
- `type`: Payment type (required)
- `date`: Payment date in YYYY-MM-DD format (required)  
- `concepts`: Array of payment components/line items (required, at least one). Each concept has:
  - `name`: Required name/description for the concept (e.g., "Consulting", "Product")
  - `amount`: Numeric amount in euros per unit (required)
  - `quantity`: Numeric quantity/multiplier (1 or more). Defaults to 1 if omitted. (optional)
- `vat`: VAT percentage applied to total (e.g., 21 for 21%) (required)
- `surcharge`: Surcharge percentage (supports negative values, e.g., `-15` for IRPF withholding) (optional)
- `tag`: Optional tag for categorizing payments (string)
- `clientId`: Optional MongoDB ObjectId of the associated client (string)
- `deliveryNoteRef`: Optional reference identifier for a delivery note (string)

**Response:**
The API treats the sum of all concept totals (amount × quantity) as the VAT-inclusive base (before surcharge):
- `netAmount = base / (1 + vat/100)`
- `vatAmount = base - netAmount`
- `surchargeAmount = netAmount * (surcharge/100)` (when surcharge is provided)
- `total = netAmount + vatAmount + surchargeAmount`

### `GET /api/payments` - Get Payments (With Optional Year/Month Filtering)

**Query Parameters:**
- `year`: Optional year filter (e.g., `2024`)
- `month`: Optional month filter (1-12, requires year). Returns payments from that month only.

**Response:** Returns array of payments sorted by date (descending). When no parameters provided, returns all payments. When `year` provided alone, returns all payments in that year. When both `year` and `month` provided, returns payments for that specific month only.

Each payment includes:
- `concepts`: Array of payment components with amounts, quantities, and optional names
- `total`: Final total (`netAmount + vatAmount + surchargeAmount`)
- `vat`: VAT percentage and VAT amount
- `surcharge`: Optional surcharge percentage and amount
- `netAmount`: Net amount extracted from VAT-inclusive base

**Examples:**
- `GET /api/payments` - All payments
- `GET /api/payments?year=2024` - All payments in 2024
- `GET /api/payments?year=2024&month=3` - All payments in March 2024

### `PUT /api/payments` - Update Payment

```json
{
  "id": "payment_id",
  "date": "YYYY-MM-DD",
  "type": "income" | "outcome",
  "tag": "Client B",
  "clientId": "optional_client_object_id",
  "concepts": [
    { "name": "Updated Service", "amount": 250.00, "quantity": 2 }
  ],
  "vat": "21",
  "surcharge": "5.2",
  "deliveryNoteRef": "DN-2024-001"
}
```

**Parameters:**
- `id`: MongoDB ObjectId of the payment (required)
- `date`: New date for the payment (optional)
- `type`: Payment type either "income" or "outcome" (optional)
- `tag`: Optional tag for the payment (optional)
- `clientId`: Optional MongoDB ObjectId of the associated client, or empty string to clear (optional)
- `concepts`: New array of payment components (optional). Each concept supports quantity field.
- `vat`: New VAT percentage 0-100 (optional)
- `surcharge`: New surcharge percentage -100 to 100 (optional)
- `deliveryNoteRef`: Optional reference identifier for a delivery note (optional)

At least one of `date`, `type`, `tag`, `clientId`, `concepts`, `vat`, `surcharge`, or `deliveryNoteRef` must be provided.

When `concepts` are updated, the VAT-inclusive base is recalculated from amount × quantity.
When `vat` or `surcharge` are updated, `netAmount`, `vatAmount`, `surchargeAmount`, and `total` are recalculated using the formulas above.

**Response:** Success status with updated payment values (`total`, `vatAmount`, `surchargeAmount`, `netAmount`, `vat`, `surcharge`)

### `DELETE /api/payments` - Delete Payment

```json
{
  "id": "payment_id"
}
```

**Parameters:**
- `id`: MongoDB ObjectId of the payment to delete (required)

**Response:** Success status

### `GET /api/tags` - Get Available Tags

**Query Parameters:**
- `type`: Optional filter by payment type ("income" or "outcome")

**Response:**
```json
{
  "tags": ["Client A", "Rent", "Utilities"]
}
```

When filtered by type, returns only tags used by payments of that type.

### `GET /api/clients` - Get Clients with Pagination

**Query Parameters:**
- `search`: Optional search term to filter by client name or tax ID (case-insensitive)
- `page`: Optional page number (default: 1, minimum: 1)
- `pageSize`: Optional number of clients per page (default: 10, maximum: 100)

**Response:** Returns paginated array of clients sorted by name with pagination metadata.

**Response Format:**
```json
{
  "items": [
    {
      "_id": "ObjectId",
      "clientType": "individual" | "company",
      "name": "Client Name",
      "taxId": "12345678A",
      "address": "Tax Address",
      "phone": "+34 123 456 789",
      "email": "client@example.com",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Parameters Explanation:**
- `page`: Current page number. Pagination resets to page 1 when search term changes.
- `pageSize`: Controls how many clients appear per page. Constrained to max 100 to prevent excessive database load.
- `total`: Total number of matching clients across all pages
- `totalPages`: Total pages available for pagination
- `hasNextPage`: Whether a next page exists (useful for disabling next button)
- `hasPrevPage`: Whether a previous page exists (useful for disabling previous button)

**Examples:**
- `GET /api/clients` - First 10 clients (sorted by name)
- `GET /api/clients?page=2&pageSize=10` - Second page with 10 clients per page
- `GET /api/clients?search=John` - First page of clients matching "John" in name or tax ID
- `GET /api/clients?search=John&page=2&pageSize=20` - Second page (20 items) of clients matching "John"

**Benefits of Pagination:**
- Loads only required data instead of all clients into memory
- Reduces network payload for large client databases
- Improves page performance and responsiveness
- Works seamlessly with search filtering

### `POST /api/clients` - Create Client

```json
{
  "clientType": "individual" | "company",
  "name": "John Doe",
  "taxId": "12345678A",
  "address": "Calle Principal 123, 28001 Madrid",
  "phone": "+34 123 456 789",
  "email": "john@example.com"
}
```

**Parameters:**
- `clientType`: Client type (required) - "individual" for persons/freelancers, "company" for businesses
- `name`: Full name or business name (required)
- `taxId`: Tax ID: NIF/CIF/NIE (required)
- `address`: Tax address with postal code and city (required)
- `phone`: Optional phone number (string)
- `email`: Optional email address (string)

**Response:** Success status with inserted client ID

### `PUT /api/clients` - Update Client

```json
{
  "id": "client_id",
  "clientType": "individual" | "company",
  "name": "Jane Doe",
  "taxId": "87654321B",
  "address": "Nueva Calle 456, 28002 Madrid",
  "phone": "+34 987 654 321",
  "email": "jane@example.com"
}
```

**Parameters:**
- `id`: MongoDB ObjectId of the client (required)
- `clientType`: Client type (optional)
- `name`: Full name or business name (optional)
- `taxId`: Tax ID (optional)
- `address`: Tax address (optional)
- `phone`: Optional phone number (optional)
- `email`: Optional email address (optional)

At least one of `clientType`, `name`, `taxId`, `address`, `phone`, or `email` must be provided.

**Response:** Success status

### `DELETE /api/clients` - Delete Client

```json
{
  "id": "client_id"
}
```

**Parameters:**
- `id`: MongoDB ObjectId of the client to delete (required)

**Response:** Success status

### `POST /api/invoices/generate` - Generate Invoice PDF

```json
{
  "paymentId": "payment_id",
  "series": "Invoice" | "RectificativeInvoice" | "SimpleInvoice" | "RectificativeSimpleInvoice"
}
```

**Parameters:**
- `paymentId`: MongoDB ObjectId of the income payment (required)
- `series`: Invoice series to use for numbering (required)

**Response:**
```json
{
  "success": true,
  "invoice": {
    "series": "Invoice",
    "number": 1,
    "generatedAt": "2024-01-01T00:00:00Z"
  },
  "downloadUrl": "/api/invoices/{paymentId}"
}
```

Each series maintains independent sequential numbering. Only income payments can have generated invoices. Each payment can only have one invoice generated. The `downloadUrl` is a server-side proxy route — the browser is opened to that URL which streams the PDF content directly (no direct blob access required).

### `POST /api/payments/[id]/invoices/link` - Add External Invoice Link

```json
{
  "type": "Invoice" | "Receipt",
  "link": "https://example.com/invoice.pdf"
}
```

**URL Parameters:**
- `id`: MongoDB ObjectId of the payment

**Parameters:**
- `type`: Invoice entry type (required)
- `link`: Absolute URL to the external invoice/receipt document (required)

**Response:**
```json
{
  "ok": true
}
```

### `GET /api/invoices/[id]` - Retrieve Invoice or Provider Bill

**URL Parameters:**
- `id`: MongoDB ObjectId of the payment

**Response:** Streams the PDF file directly (`Content-Type: application/pdf`) by regenerating it server-side from payment + invoice metadata.

Returns 404 if no invoice or provider bill exists for the payment.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB (via MongoDB Node.js Driver)
- **PDF Generation:** pdf-lib (serverless-compatible PDF generation)
- **Styling:** Tailwind CSS 4
- **Fonts:** Geist Sans & Geist Mono
- **Deployment:** Vercel-ready

## Deployment on Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `MONGODB_URI`: Your MongoDB connection string
4. Deploy!

Vercel will automatically detect Next.js and configure the build settings.

## Roadmap

- [x] Create payment list view with summary cards
- [x] Real-time payment list updates
- [x] Month navigation and filtering
- [x] Full payment editing with clickable rows (date, type, tag, concepts, VAT)
- [x] Payment tags with type-based autocomplete
- [x] Edit all payment fields in modal with auto-recalculation
- [x] Delete payments with confirmation modal
- [x] Edit payments via clickable table rows
- [x] Add client management with search and filtering
- [x] Pagination for large datasets (clients list)
- [x] Generate PDF invoices for income payments with 4 sequential series
- [x] Upload and store provider bills for outcome payments
- [x] Download invoices and provider bills from payment details
- [ ] Add advanced filtering and search capabilities
- [ ] Export payments to CSV/PDF
- [ ] Add more payment fields (description, invoice number, etc.)
- [ ] Customize invoice templates with company branding
- [ ] Bulk invoice generation and email delivery
- [ ] User authentication and authorization
- [ ] Multi-user support with separate accounts
- [ ] Payment analytics and reporting
