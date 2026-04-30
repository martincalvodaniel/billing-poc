# Billing POC

A proof of concept billing system built with [Next.js](https://nextjs.org) for managing and tracking income and outcome payments with real-time visualization and MongoDB storage.

## Features

- **Payment Browser** - Dynamic list view with:
  - Summary cards showing total income, total outcome, and net balance
  - Sortable payment table with date, type, amounts, and totals
  - Real-time updates when new payments are added
  - Responsive table design with proper currency formatting
  
- **Payment Entry Form** - Intuitive form to add new transactions:
  - Type selector (Income/Outcome)
  - Date picker
  - Net Amount and VAT inputs
  - Auto-calculated total amount
  
- **MongoDB Storage** - Persistent data storage using MongoDB Atlas or local instance
- **RESTful API** - API routes for payment CRUD operations (GET, POST)
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode Support** - Automatic theme switching with Tailwind CSS
- **Form Validation** - Client-side and server-side validation
- **Type Safety** - Full TypeScript support throughout

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm installed
- MongoDB running locally on port 27017 (or MongoDB Atlas for cloud storage)

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Set up your MongoDB connection:

   **Option A: Local MongoDB (Development) - Default**
   
   The project is preconfigured to use local MongoDB at `mongodb://localhost:27017/billing-poc`. Just ensure MongoDB is running:
   
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```
   
   The `.env.local` file is already configured. If needed, you can copy the example:
   ```bash
   cp .env.local.example .env.local
   ```

   **Option B: MongoDB Atlas (Production)**
   
   - Create a MongoDB Atlas cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Get your connection string
   - Update `.env.local`:
   ```bash
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

### Landing Page Layout

The home page is organized into two main sections:

**Left Column (Form):**
- Use the "New Payment" form to quickly add income or outcome transactions
- Select the payment type, date, and amounts
- The form automatically calculates the total (net + VAT)
- Click "Save Payment" to submit

**Right Column (Payment Browser):**
- View all payments in a clean, sortable table
- Summary cards at the top show key metrics:
  - Total Income (green)
  - Total Outcome (red)
  - Net Balance (blue)
- Each payment row displays date, type, net amount, VAT, and total
- The list updates in real-time when new payments are added

## Project Structure

```
app/
├── api/
│   └── payments/
│       └── route.ts              # Payment API endpoints (GET, POST)
├── components/
│   ├── PaymentForm.tsx           # Payment entry form component
│   └── PaymentsList.tsx          # Payment browser/list component with summary
├── layout.tsx                    # Root layout with metadata
├── page.tsx                      # Home page with form and list layout
└── globals.css                   # Global styles and typography
lib/
├── mongodb.ts                    # MongoDB connection utility
└── types.ts                      # TypeScript type definitions
public/                           # Static assets
```

## API Endpoints

### `POST /api/payments`

Create a new payment entry.

**Request Body:**
```json
{
  "type": "income" | "outcome",
  "date": "YYYY-MM-DD",
  "netAmount": "100.00",
  "vat": "21.00"
}
```

**Response:**
```json
{
  "success": true,
  "id": "payment_id"
}
```

### `GET /api/payments`

Retrieve all payment entries, sorted by date (descending).

**Response:**
```json
{
  "payments": [
    {
      "_id": "payment_id",
      "type": "income",
      "date": "2026-01-24",
      "netAmount": 100,
      "vat": 21,
      "total": 121,
      "createdAt": "2026-01-24T10:00:00Z",
      "updatedAt": "2026-01-24T10:00:00Z"
    }
  ]
}
```

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
