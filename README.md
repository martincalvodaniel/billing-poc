# Billing POC

A proof of concept billing system built with [Next.js](https://nextjs.org) for tracking income and outcome payments with MongoDB storage.

## Features

- **Payment Entry Form** - Add new payment transactions with the following fields:
  - Type (Income/Outcome)
  - Date
  - Net Amount
  - VAT
  - Auto-calculated Total Amount
- **MongoDB Storage** - Persistent data storage using MongoDB Atlas
- **RESTful API** - API routes for payment CRUD operations
- **Responsive Design** - Works on desktop and mobile devices
- **Dark Mode Support** - Automatic theme switching
- **Form Validation** - Client-side and server-side validation

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

## Project Structure

```
app/
├── api/
│   └── payments/
│       └── route.ts          # Payment API endpoints (GET, POST)
├── components/
│   └── PaymentForm.tsx       # Payment entry form component
├── layout.tsx                # Root layout with metadata
├── page.tsx                  # Home page
└── globals.css               # Global styles
lib/
├── mongodb.ts                # MongoDB connection utility
└── types.ts                  # TypeScript type definitions
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

- [ ] Create payment list view
- [ ] Implement edit/delete functionality
- [ ] Add filtering and search
- [ ] Export to CSV/PDF
- [ ] Add more payment fields (description, category, etc.)
- [ ] Add pagination for large datasets
- [ ] Implement authentication
