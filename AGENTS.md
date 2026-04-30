# Agent Guidelines for Billing POC

This document provides best practices and guidelines for AI agents working with the Billing POC codebase.

## Project Overview

**Billing POC** is a proof-of-concept billing system built with Next.js 16, TypeScript, React 19, and MongoDB. It provides a full-stack solution for managing income and outcome payments with real-time visualization.

### Key Characteristics
- **Full TypeScript** with strict mode enabled
- **Server-side rendering** with Next.js App Router
- **Database**: MongoDB with type-safe collections
- **Styling**: Tailwind CSS 4 (utility-first)
- **No external UI libraries** - custom components using semantic HTML

## Architecture Patterns

### Project Structure
```
app/                          # Next.js App Router directory
├── api/payments/route.ts      # RESTful API endpoints
├── components/                # React components
│   ├── PaymentForm.tsx        # Controlled form component
│   └── PaymentsList.tsx       # Payment display with summary
├── page.tsx                   # Home page (main layout)
├── layout.tsx                 # Root layout
└── globals.css                # Global styles

lib/                          # Shared utilities
├── mongodb.ts                # MongoDB connection (singleton pattern)
└── types.ts                  # TypeScript type definitions
```

### Data Flow
1. **User Input** → `PaymentForm.tsx` (client-side validation)
2. **API Request** → `app/api/payments/route.ts` (server-side validation)
3. **Database** → MongoDB collection `payments`
4. **Display** → `PaymentsList.tsx` (fetches via API, renders in real-time)

## Code Style & Conventions

### TypeScript
- **Strict mode enabled** - leverage full type checking
- Use `interface` for data contracts, `type` for unions/utilities
- Always export types from `lib/types.ts` for consistency
- Avoid `any` type - use `unknown` with proper type guards if necessary

### React Components
- Use **functional components** with hooks (React 19)
- Component files use `.tsx` extension
- Follow naming: PascalCase for components, camelCase for handlers
- Extract reusable logic into separate functions or custom hooks
- Use semantic HTML (avoid divitis)

Example component structure:
```typescript
'use client'; // if using client-side features

import { useState } from 'react';
import type { PaymentType } from '@/lib/types';

export default function ComponentName() {
  const [state, setState] = useState<Type>(initialValue);
  
  const handleClick = () => {
    // handler logic
  };

  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

### API Routes
- All routes return `NextResponse.json()`
- **Always validate** request body data before processing
- Parse numeric strings to numbers: `parseFloat()`, `parseInt()`
- Include proper HTTP status codes (200, 201, 400, 500)
- Log errors to console for debugging

Example error handling:
```typescript
try {
  // operation
} catch (error) {
  console.error('Context of error:', error);
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  );
}
```

### Styling
- Use Tailwind CSS utility classes exclusively (no CSS files beyond globals.css)
- Responsive design: mobile-first with `sm:`, `md:`, `lg:` prefixes
- Color palette: 
  - Income: green (`text-green-600`, `bg-green-50`)
  - Outcome: red (`text-red-600`, `bg-red-50`)
  - Balance/Neutral: blue (`text-blue-600`, `bg-blue-50`)
- Dark mode: Tailwind defaults handle `dark:` classes

## Common Tasks & Patterns

### Adding a New API Endpoint
1. Create file: `app/api/[resource]/route.ts`
2. Define handler function with proper types
3. Implement validation in the handler
4. Return `NextResponse.json()` with appropriate status
5. Add endpoint documentation to README.md

### Adding a New Component
1. Create file: `app/components/ComponentName.tsx`
2. Define TypeScript interfaces for props
3. Use `'use client'` if component needs interactivity
4. Export as default
5. Import and use in `page.tsx` or other components

### Database Operations
- Always use `getDatabase()` from `lib/mongodb.ts`
- Collections are type-safe: `db.collection<Payment>("payments")`
- Handle cursor methods: `.find()`, `.insertOne()`, `.updateOne()`, `.deleteOne()`
- Use proper sorting/filtering for queries

Example pattern:
```typescript
import { getDatabase } from "@/lib/mongodb";
import { Payment } from "@/lib/types";

const db = await getDatabase();
const payments = await db
  .collection<Payment>("payments")
  .find({ type: "income" })
  .sort({ date: -1 })
  .toArray();
```

### Form Handling (Payment Entry Form Pattern)
- Use controlled components with `useState`
- Validate on input change (optional) and on submit (required)
- Parse string inputs to appropriate types (numbers, dates, percentages)
- **VAT input is a percentage (0-100)**: Calculate net amount as `total / (1 + vat%)`
- Disable form submission while processing
- Provide user feedback (success/error messages)
- Display calculated amounts in real-time (VAT amount and net amount)

#### Payment Calculation Pattern

The billing system uses a **percentage-based VAT model**:

**User Input:**
- **Total Amount (with VAT)**: The gross amount including taxes (e.g., €410.48)
- **VAT (%)**: The tax percentage to deduct (e.g., 21%)

**Calculation:**
```
Net Amount = Total / (1 + VAT% / 100)
VAT Amount = Total - Net Amount
```

**Example:**
```
Total: €410.48
VAT: 21%
Net: 410.48 / 1.21 = €339.24
VAT Amount: 410.48 - 339.24 = €71.24
```

This reflects real-world salary/invoice scenarios where you know the total amount and need to extract the deductions.

## Development Workflow

### Setup
```bash
# Install dependencies
pnpm install

# Start MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start development server
pnpm dev
```

### Running & Testing
- Development server: `pnpm dev` (runs on http://localhost:3000)
- Build check: `pnpm build`
- Linting: `pnpm lint`
- Database: Connect locally via MongoDB Compass to `mongodb://localhost:27017/billing-poc`

### File Modifications
When modifying existing files:
1. Maintain type safety - don't weaken TypeScript constraints
2. Preserve component structure and naming conventions
3. Keep API response formats consistent with existing patterns
4. Update types in `lib/types.ts` if adding new fields
5. Run `pnpm lint` after changes to catch style issues

## Type Safety Guidelines

### When Working with Database
```typescript
// ✅ Good: Type-safe collection access
const db = await getDatabase();
const payments = await db.collection<Payment>("payments").find({}).toArray();

// ❌ Avoid: Untyped collections
const result = await db.collection("payments").find({});
```

### When Handling Forms
```typescript
// ✅ Good: Type fields properly
interface FormState {
  type: PaymentType;
  date: string; // ISO format "YYYY-MM-DD"
  total: string; // Total amount with VAT
  vat: string;   // VAT percentage (0-100)
}

// ❌ Avoid: Loose typing
const formData: any = { /* ... */ };
```

### When Creating API Payloads
```typescript
// ✅ Good: Calculate net from total and VAT percentage
const totalAmount = parseFloat(total);
const vatPercentage = parseFloat(vat);
const netAmount = totalAmount / (1 + vatPercentage / 100);
const vatAmount = totalAmount - netAmount;

const payment: Omit<Payment, "_id"> = {
  type,
  date,
  netAmount,
  vat: vatAmount,
  total: totalAmount,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ❌ Avoid: Loose object creation
const payment = { type, date, total, vat };
```

## Validation Patternstotal === undefined || vat === undefined) {
  return NextResponse.json(
    { error: "Missing required fields" },
    { status: 400 }
  );
}

const totalAmount = parseFloat(total);
const vatPercentage = parseFloat(vat);

if (isNaN(totalAmount) || isNaN(vatPercentage)) {
  return NextResponse.json(
    { error: "Invalid numeric values" },
    { status: 400 }
  );
}

if (vatPercentage < 0 || vatPercentage > 100) {
  return NextResponse.json(
    { error: "VAT percentage must be between 0 and 100" },
    { status: 400 }
  );
}

// Calculate net from total and VAT percentage
const netAmount = totalAmount / (1 + vatPercentage / 100);
const vatAmount = totalAmount - netAmount;f (isNaN(net) || isNaN(vatAmount)) {
  return NextResponse.json(
    { error: "Invalid numeric values" },
    { status: 400 }
  );
}
```

### Client-Side Validation (UX Enhancement)
- Use HTML5 input attributes: `required`, `type="date"`, `inputMode="decimal"`
- Provide real-time feedback to users
- Disable submit button during form submission

## Error Handling Best Practices

1. **Server-side**: Always wrap database operations in try-catch
2. **Logging**: Log full error for debugging, return friendly message to client
3. **Status codes**: Use appropriate HTTP status (400 for validation, 500 for server errors)
4. **API contract**: Always return JSON with consistent error structure

## Environment Variables

### Required
- `MONGODB_URI`: Connection string for MongoDB (local or Atlas)

### Development
- Uses `.env.local` for local overrides
- Default: `mongodb://localhost:27017/billing-poc`

### Deployment (Vercel)
- Set `MONGODB_URI` in Vercel project settings
- Uses MongoDB Atlas for production

## Performance Considerations

1. **Database queries**: Sort by date descending for chronological order
2. **Real-time updates**: Implement polling or WebSocket if needed (future feature)
3. **Bundle size**: No external UI libraries - keep custom CSS in Tailwind
4. **MongoDB connection**: Uses singleton pattern with global state in development

## Security Notes

- **Validation**: All user inputs validated on server before database operations
- **SQL/Injection**: Using MongoDB driver prevents injection attacks
- **CORS**: Handled by Next.js (same-origin requests on localhost)
- **Environment variables**: Never expose `MONGODB_URI` client-side

## Future Development Guidelines

When implementing planned features (from roadmap), follow these patterns:

### Edit/Delete Functionality
- Add PUT and DELETE methods to `app/api/payments/route.ts`
- Validate `_id` parameter and user permissions
- Update frontend components to trigger these endpoints

### Search & Filtering
- Add query parameters to GET endpoint: `/api/payments?type=income&dateFrom=2026-01-01`
- Parse and validate query parameters
- Return filtered results

### Pagination
- Add `skip` and `limit` query parameters
- Implement cursor-based pagination for better performance
- Return metadata: `{ payments: [], total: 100, page: 1 }`

### User Authentication
- Integrate auth library (e.g., NextAuth.js, Auth0)
- Add session validation to API routes
- Filter payments by user ID

### Export to CSV/PDF
- Create new API endpoint: `/api/payments/export`
- Use lightweight library (csv-stringify for CSV, pdfkit for PDF)
- Return file as attachment

## Useful Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Run ESLint

# MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest
docker stop mongodb
docker start mongodb

# Database inspection
# Use MongoDB Compass: mongodb://localhost:27017
```

## Debugging Tips

1. **API Issues**: Check Network tab in DevTools, review console logs
2. **MongoDB Connection**: Verify URI, check MongoDB is running
3. **Type Errors**: Run TypeScript compiler: `npx tsc --noEmit`
4. **Build Issues**: Clear `.next` folder: `rm -rf .next && pnpm build`

## File Access Guidelines

When reading/modifying files:
- **Types**: Always check `lib/types.ts` first
- **Styles**: Modify Tailwind classes in component files (no CSS files)
- **Components**: Keep components focused and single-responsibility
- **API**: Review existing patterns in `app/api/payments/route.ts`

## Summary Checklist

Before completing any task, verify:
- [ ] Code follows TypeScript strict mode
- [ ] All types are defined and imported from `lib/types.ts`
- [ ] API endpoints have server-side validation
- [ ] Error messages are logged to console
- [ ] Styling uses only Tailwind utility classes
- [ ] Components are functional and use React 19 hooks
- [ ] No `any` types without justification
- [ ] Linting passes: `pnpm lint`
- [ ] Code maintains existing architecture patterns
