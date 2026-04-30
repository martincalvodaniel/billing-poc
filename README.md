# Billing POC

A proof-of-concept billing system for managing and tracking income and outcome payments with real-time visualization, built with Next.js 16, TypeScript, React 19, and MongoDB.

## Features

- **Payment Browser** - View all transactions with summary cards (total income, outcome, balance) and real-time updates
- **Payment Entry Form** - Quick form to add payments with gross/net calculation (enter total with VAT %, system calculates net) — VAT defaults to 21%. Supports negative amounts for refunds, corrections, and chargebacks
- **Type Safety** - Full TypeScript with strict mode throughout the codebase
- **RESTful API** - GET and POST endpoints for payment operations
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Form & Server Validation** - Client and server-side validation for data integrity

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

For detailed setup instructions including MongoDB Atlas configuration, see [AGENTS.md](./AGENTS.md#setup).

## Development

For detailed development guidelines, code patterns, TypeScript conventions, and architectural patterns, see [AGENTS.md](./AGENTS.md).

## API Endpoints

### `POST /api/payments` - Create Payment

```json
{
  "type": "income" | "outcome",
  "date": "YYYY-MM-DD",
  "total": "410.48",
  "vat": "21"
}
```

**Parameters:**
- `total`: Total amount including VAT (e.g., €410.48)
- `vat`: VAT percentage (e.g., 21 for 21%)

**Response:**
The API calculates `netAmount` from total and VAT percentage using: `netAmount = total / (1 + vat/100)`

### `GET /api/payments` - Get All Payments

Returns array of payments sorted by date (descending).

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
- [ ] Implement edit/delete functionality for payments
- [ ] Add advanced filtering and search capabilities
- [ ] Export payments to CSV/PDF
- [ ] Add more payment fields (description, category, invoice number, etc.)
- [ ] Pagination for large datasets
- [ ] User authentication and authorization
- [ ] Multi-user support with separate accounts
- [ ] Payment analytics and reporting
