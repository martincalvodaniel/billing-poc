# Billing POC

A proof-of-concept billing system for managing and tracking income and outcome payments with real-time visualization, built with Next.js 16, TypeScript, React 19, and MongoDB.

## Features

- **Payment Browser** - View filtered transactions in a table (day, type, tag, total, VAT, net amount) with summary cards (total income with count, outcome with count, balance) and real-time updates
- **Month Navigation** - Dedicated filter section at the top displays the selected month and controls. Calendar picker (closes when clicking outside) with prev/next navigation, month grid, year selection, and manual year input. Quick icon button jumps to the current month and disables when already there. Add payment button positioned adjacent to the calendar for easy access. Automatically navigates to the saved payment's month after creating a new payment. Form date field syncs with calendar selection to match the viewed month
- **Payment Entry Form (Modal)** - Add payments in a centered modal launched from the monthly view header beside the calendar picker. Shares the same control styles and disabled states as the month navigation buttons. Gross/net calculation (enter total with VAT %, system calculates net) — VAT defaults to 21%. Form type and date are sticky after saving to speed up batch entry. Supports negative amounts for refunds, corrections, and chargebacks
- **Payment Tags** - Add optional tags to categorize payments (e.g., "Client A", "Rent"). Autocomplete suggests previously used tags after 1 second of typing. Tags are filtered by payment type — income and outcome tags are separate
- **Donut Charts by Tag** - View visual breakdown of income and outcome by tag with percentage distribution. Interactive sorting controls allow sorting by percentage or name (ascending/descending). Legend positioned on the right side of the chart for better space utilization. Tags maintain consistent colors across all sorting options. Charts appear between summary cards and payment list for quick insights
- **Modal Payment Editing** - Click any date (shows day only since month/year are in calendar picker), type, tag, total, or VAT in the payment list to open a centered edit modal. VAT displays as `(percentage%) amount`. Input controls and autocomplete for tags adapt to field type. All related fields (net amount, VAT amount) automatically recalculate
- **Delete Payments** - Remove payments with a confirmation modal that displays payment details (date, type, tag, total) before deletion to prevent accidental removal
- **Year Summary View** - Dedicated yearly page with prev/next/current year controls, inline year picker (grid + manual entry), yearly totals with payment counts, tag donuts, and monthly breakdown cards; top navigation links between monthly list and yearly summary
- **Consistent Design System** - All pages follow unified layout, navigation, colors, and spacing patterns for a cohesive user experience
- **Type Safety** - Full TypeScript with strict mode throughout the codebase
- **RESTful API** - GET, POST, PUT, and DELETE endpoints for payment operations
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Form & Server Validation** - Client and server-side validation for data integrity
- **Accessibility Compliant** - WCAG 2.1 Level A compliant with ARIA labels, live regions, keyboard navigation, and screen reader support

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

For detailed setup instructions including MongoDB Atlas configuration, see [docs/agents/workflow.md](./docs/agents/workflow.md).

## Development

For detailed development guidelines, code patterns, TypeScript conventions, and architectural patterns, see the modular documentation in [AGENTS.md](./AGENTS.md) (loads only relevant docs per task for efficient AI context).

## API Endpoints

### `POST /api/payments` - Create Payment

```json
{
  "type": "income" | "outcome",
  "date": "YYYY-MM-DD",
  "total": "410.48",
  "vat": "21",
  "tag": "Client A"
}
```

**Parameters:**
- `type`: Payment type (required)
- `date`: Payment date in YYYY-MM-DD format (required)  
- `total`: Total amount including VAT (e.g., €410.48) (required)
- `vat`: VAT percentage (e.g., 21 for 21%) (required)
- `tag`: Optional tag for categorizing payments (string)

**Response:**
The API calculates `netAmount` from total and VAT percentage using: `netAmount = total / (1 + vat/100)`

### `GET /api/payments` - Get All Payments

Returns array of payments sorted by date (descending).

### `PUT /api/payments` - Update Payment

```json
{
  "id": "payment_id",
  "date": "YYYY-MM-DD",
  "type": "income" | "outcome",
  "tag": "Client B",
  "total": "450.00",
  "vat": "21"
}
```

**Parameters:**
- `id`: MongoDB ObjectId of the payment (required)
- `date`: New date for the payment (optional)
- `type`: Payment type either "income" or "outcome" (optional)
- `tag`: Optional tag for the payment (optional)
- `total`: New total amount including VAT (optional)
- `vat`: New VAT percentage 0-100 (optional)

At least one of `date`, `type`, `tag`, `total`, or `vat` must be provided.

When `total` is updated, VAT percentage is preserved and net amount is recalculated.
When `vat` is updated, net amount and VAT amount are recalculated based on total.

**Response:** Success status with updated payment values (`total`, `vat`, `netAmount`)

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
- [ ] Add advanced filtering and search capabilities
- [ ] Export payments to CSV/PDF
- [ ] Add more payment fields (description, invoice number, etc.)
- [ ] Pagination for large datasets
- [ ] User authentication and authorization
- [ ] Multi-user support with separate accounts
- [ ] Payment analytics and reporting
