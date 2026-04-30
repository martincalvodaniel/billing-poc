# Billing POC

A proof of concept billing system built with [Next.js](https://nextjs.org) for tracking income and outcome payments.

## Features

- **Payment Entry Form** - Add new payment transactions with the following fields:
  - Type (Income/Outcome)
  - Date
  - Net Amount
  - VAT
  - Auto-calculated Total Amount
- **Responsive Design** - Works on desktop and mobile devices
- **Dark Mode Support** - Automatic theme switching
- **Form Validation** - Client-side validation for all fields

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
app/
├── components/
│   └── PaymentForm.tsx    # Payment entry form component
├── layout.tsx             # Root layout with metadata
├── page.tsx               # Home page
└── globals.css            # Global styles
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Fonts:** Geist Sans & Geist Mono

## Roadmap

- [ ] Add data persistence (local storage or database)
- [ ] Create payment list view
- [ ] Implement edit/delete functionality
- [ ] Add filtering and search
- [ ] Export to CSV/PDF
- [ ] Add more payment fields (description, category, etc.)
