# Billing POC

A proof-of-concept billing system for managing and tracking income and outcome payments with real-time visualization, built with Next.js 16, TypeScript, React 19, and MongoDB.

## Features

- **Payment Browser** - View filtered transactions in a table (day, type, tag, total, VAT, net amount) with summary cards (total income with count, outcome with count, balance) and real-time updates
- **Payment Components** - Payments can be composed of multiple named concepts (line items). Each concept has a required name, amount, and quantity (1 or more multiplier). Quantities are multiplied by the amount to calculate the contribution of each concept to the total. The total payment is the sum of (amount × quantity) for all components. VAT is applied uniformly at the payment level.
- **Month Navigation** - Dedicated filter section at the top displays the selected month and controls. Calendar picker (closes when clicking outside) with prev/next navigation, month grid, year selection, and manual year input. Quick icon button jumps to the current month and disables when already there. Add payment button positioned adjacent to the calendar for easy access. Automatically navigates to the saved payment's month after creating a new payment. Form date field syncs with calendar selection to match the viewed month
- **Payment Entry Form (Modal)** - Add payments in a centered modal launched from the monthly view header beside the calendar picker. Shares the same control styles and disabled states as the month navigation buttons. Add multiple payment components with optional names and amounts. Gross/net calculation (enter component amounts with VAT %, system calculates net) — VAT defaults to 21%. Form type and date are sticky after saving to speed up batch entry. Supports negative amounts for refunds, corrections, and chargebacks. Keyboard shortcuts: **ENTER** to save, **ESC** to cancel
- **Payment Tags** - Add optional tags to categorize payments (e.g., "Client A", "Rent"). Autocomplete suggests previously used tags after 1 second of typing. Tags are filtered by payment type — income and outcome tags are separate
- **Donut Charts by Tag** - View visual breakdown of income and outcome by tag with percentage distribution. Interactive sorting controls allow sorting by percentage or name (ascending/descending). Legend positioned on the right side of the chart for better space utilization. Tags maintain consistent colors across all sorting options. Charts appear between summary cards and payment list for quick insights
- **Modal Payment Editing** - Click any date (shows day only since month/year are in calendar picker), type, tag, total, or VAT in the payment list to open a centered edit modal. VAT displays as `(percentage%) amount`. Input controls and autocomplete for tags adapt to field type. All related fields (net amount, VAT amount) automatically recalculate. Keyboard shortcuts: **ENTER** to save (except when tag dropdown is open), **ESC** to cancel
- **Payment Detail Modal** - View full details of any payment from the monthly list via an action button with an icon. The modal shows date, type, tag, total, VAT (percentage and amount), net amount, and all payment components with names, amounts, and optional concept-level VAT. Keyboard shortcut: **ESC** or **ENTER** to close
- **Delete Payments** - Remove payments with a confirmation modal that displays payment details (date, type, tag, total) before deletion to prevent accidental removal. Keyboard shortcuts: **ENTER** to confirm deletion, **ESC** to cancel
- **Year Summary View** - Dedicated yearly page with prev/next/current year controls, inline year picker (grid + manual entry), yearly totals with payment counts, tag donuts, and monthly breakdown cards with clickable month names that navigate to the month detail view; top navigation links between monthly list and yearly summary
- **Client Management** - Manage business contacts with full name/surname (individuals) or business name (companies), Tax ID (NIF/CIF/NIE), and tax address. Search clients by name or tax ID with real-time filtering. Create, edit, and delete client records. Support for both individual freelancers and company entities.
- **Consistent Design System** - All pages follow unified layout, navigation, colors, and spacing patterns for a cohesive user experience
- **Type Safety** - Full TypeScript with strict mode throughout the codebase
- **RESTful API** - GET, POST, PUT, and DELETE endpoints for payment and client operations with support for payment components
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Form & Server Validation** - Client and server-side validation for data integrity
- **Accessibility Compliant** - WCAG 2.1 Level A compliant with ARIA labels, live regions, keyboard navigation, screen reader support, and keyboard shortcuts for all modal interactions (ESC to cancel/close, ENTER to confirm/save)

## Getting Started

### Prerequisites
- Node.js 20+ and pnpm
- MongoDB running locally or MongoDB Atlas account

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Start MongoDB (if using local)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 3. Run development server
pnpm dev
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
  "tag": "Client A"
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
- `tag`: Optional tag for categorizing payments (string)

**Response:**
The API calculates `netAmount` from the sum of all concept totals (amount × quantity) and VAT percentage using: `netAmount = total / (1 + vat/100)` where `total` is the sum of (amount × quantity) for all concepts.

### `GET /api/payments` - Get Payments (With Optional Year/Month Filtering)

**Query Parameters:**
- `year`: Optional year filter (e.g., `2024`)
- `month`: Optional month filter (1-12, requires year). Returns payments from that month only.

**Response:** Returns array of payments sorted by date (descending). When no parameters provided, returns all payments. When `year` provided alone, returns all payments in that year. When both `year` and `month` provided, returns payments for that specific month only.

Each payment includes:
- `concepts`: Array of payment components with amounts, quantities, and optional names
- `total`: Sum of (amount × quantity) for all concepts
- `vat`: VAT percentage and VAT amount
- `netAmount`: Net amount after VAT deduction

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
  "concepts": [
    { "name": "Updated Service", "amount": 250.00, "quantity": 2 }
  ],
  "vat": "21"
}
```

**Parameters:**
- `id`: MongoDB ObjectId of the payment (required)
- `date`: New date for the payment (optional)
- `type`: Payment type either "income" or "outcome" (optional)
- `tag`: Optional tag for the payment (optional)
- `concepts`: New array of payment components (optional). Each concept supports quantity field.
- `vat`: New VAT percentage 0-100 (optional)

At least one of `date`, `type`, `tag`, `concepts`, or `vat` must be provided.

When `concepts` are updated, totals are automatically recalculated using amount × quantity.
When `vat` is updated, net amount and VAT amount are recalculated based on total.

**Response:** Success status with updated payment values (`total`, `vatAmount`, `netAmount`, `vat`)

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

### `GET /api/clients` - Get Clients

**Query Parameters:**
- `search`: Optional search term to filter by client name or tax ID (case-insensitive)

**Response:** Returns array of clients sorted by name.

Each client includes:
- `_id`: MongoDB ObjectId
- `clientType`: Either "individual" or "company"
- `name`: Full name (individual) or business name (company)
- `taxId`: Tax ID (NIF/CIF/NIE)
- `address`: Tax address with postal code and city
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Examples:**
- `GET /api/clients` - All clients
- `GET /api/clients?search=John` - Clients matching "John" in name or tax ID

### `POST /api/clients` - Create Client

```json
{
  "clientType": "individual" | "company",
  "name": "John Doe",
  "taxId": "12345678A",
  "address": "Calle Principal 123, 28001 Madrid"
}
```

**Parameters:**
- `clientType`: Client type (required) - "individual" for persons/freelancers, "company" for businesses
- `name`: Full name or business name (required)
- `taxId`: Tax ID: NIF/CIF/NIE (required)
- `address`: Tax address with postal code and city (required)

**Response:** Success status with inserted client ID

### `PUT /api/clients` - Update Client

```json
{
  "id": "client_id",
  "clientType": "individual" | "company",
  "name": "Jane Doe",
  "taxId": "87654321B",
  "address": "Nueva Calle 456, 28002 Madrid"
}
```

**Parameters:**
- `id`: MongoDB ObjectId of the client (required)
- `clientType`: Client type (optional)
- `name`: Full name or business name (optional)
- `taxId`: Tax ID (optional)
- `address`: Tax address (optional)

At least one of `clientType`, `name`, `taxId`, or `address` must be provided.

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

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB (via MongoDB Node.js Driver)
- **Styling:** Tailwind CSS 4
- **Fonts:** Geist Sans & Geist Mono
- **Deployment:** Vercel-ready

## Deployment on Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your `MONGODB_URI` environment variable in Vercel project settings
4. Deploy!

Vercel will automatically detect Next.js and configure the build settings.

## Roadmap

- [x] Create payment list view with summary cards
- [x] Real-time payment list updates
- [x] Month navigation and filtering
- [x] Inline payment editing (date, type, tag, total, VAT)
- [x] Payment tags with type-based autocomplete
- [x] Edit payment amount and VAT fields inline with auto-recalculation
- [x] Delete payments with confirmation modal
- [x] View payment details in modal from monthly list
- [x] Add client management with search and filtering
- [ ] Add advanced filtering and search capabilities
- [ ] Export payments to CSV/PDF
- [ ] Add more payment fields (description, invoice number, etc.)
- [ ] Pagination for large datasets
- [ ] User authentication and authorization
- [ ] Multi-user support with separate accounts
- [ ] Payment analytics and reporting
