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
4. **Display** → `PaymentsList.tsx` (fetches all payments, filters by selected month, renders in real-time)

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
- Support GET (retrieve), POST (create), and PUT (update) methods
- **Always validate** request body data before processing
- Parse numeric strings to numbers: `parseFloat()`, `parseInt()`
- Include proper HTTP status codes (200, 201, 400, 404, 500)
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

### Formatting Conventions
- **Currency**: Use EUR (€) with Spanish locale (es-ES)
- **Dates**: Use English locale (en-US) for internationalization
- Use `Intl.NumberFormat` and `toLocaleDateString` for localization

Example currency formatting:
```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};
```

Example date formatting:
```typescript
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
```

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
- **VAT default**: Set to 21% as the default VAT percentage (common in Europe) for improved UX
- **Negative amounts supported**: Total amount field accepts negative values for refunds, corrections, and chargebacks. Calculations (net and VAT) handle negative values proportionally
- Disable form submission while processing
- Provide user feedback via toast notifications (see User Feedback pattern below)
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

### Month Navigation Pattern (Filter by Month)
For displaying payments filtered by month with navigation controls and calendar picker:

1. **State Management** - Track selected month with `selectedDate` state (set to 1st of current month) and `showCalendar` state for dropdown visibility
2. **Filter Logic** - Create `getFilteredPayments()` to match payment dates against selected month/year
3. **Calendar Picker** - Render clickable month grid (4 columns) showing all 12 months of the selected year with selection highlighting
4. **Inside Calendar** - Implement prev/next month buttons and year navigation controls
5. **Display Toggle** - Show formatted month/year button with calendar icon (📅) that toggles calendar dropdown
6. **Recalculate Summaries** - Update income/outcome/balance based on filtered payments
7. **Empty State** - Show custom message when no payments in selected month

Example pattern:
```typescript
const [selectedDate, setSelectedDate] = useState(() => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
});
const [showCalendar, setShowCalendar] = useState(false);

const getFilteredPayments = () => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  return payments.filter((payment) => {
    const paymentDate = new Date(payment.date);
    return (
      paymentDate.getFullYear() === year &&
      paymentDate.getMonth() === month
    );
  });
};

const handleCalendarMonthSelect = (year: number, month: number) => {
  setSelectedDate(new Date(year, month, 1));
  setShowCalendar(false);
};

const renderCalendarPicker = () => {
  const today = new Date();
  const currentMonth = today.getMonth();

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header with Prev/Next month and current month display */}
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            ← Prev
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-zinc-900">
            {new Date(selectedDate.getFullYear(), selectedDate.getMonth()).toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "long" 
            })}
          </span>
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Next →
          </button>
        </div>

        {/* 12-month grid (4 columns) */}
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, monthIndex) => {
            const year = selectedDate.getFullYear();
            const month = monthIndex;
            const isSelected = year === selectedDate.getFullYear() && month === selectedDate.getMonth();

            return (
              <button 
                key={monthIndex} 
                onClick={() => handleCalendarMonthSelect(year, month)}
                className={`rounded px-2 py-2 text-xs font-medium ${
                  isSelected 
                    ? "bg-blue-600 text-white dark:bg-blue-700" 
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {new Date(year, month).toLocaleDateString("en-US", { month: "short" })}
              </button>
            );
          })}
        </div>

        {/* Year navigation */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear() - 1, selectedDate.getMonth(), 1))}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            ← Prev Year
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-zinc-900">
            {selectedDate.getFullYear()}
          </span>
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear() + 1, selectedDate.getMonth(), 1))}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            Next Year →
          </button>
        </div>
      </div>
    </div>
  );
};

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
};

const filteredPayments = getFilteredPayments();
```

**In JSX - Month selector header with calendar:**
```tsx
<div className="flex items-center justify-between">
  <h2>Payments ({filteredPayments.length})</h2>
  <div className="relative">
    <button 
      onClick={() => setShowCalendar(!showCalendar)}
      className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
    >
      📅 {formatMonthYear(selectedDate)}
    </button>
    {showCalendar && renderCalendarPicker()}
  </div>
</div>
```

**Features:**
- Calendar dropdown toggles with button click
- 4-column grid of months for easy selection
- Navigate months while calendar is open with prev/next buttons in header
- Year navigation controls at bottom
- Selected month highlighted in blue for visual feedback
- Click any month to select and auto-close calendar

**Summary recalculation** - Use `filteredPayments` instead of all `payments` when calculating totals

### Inline Editing Pattern (Edit Payment Fields)
For editing individual payment fields inline in a list:

1. **State Management** - Track editing state with `editingId` and `editingValue` per field (or separate states for each field)
2. **Display Toggle** - Show formatted display or input based on `editingId`
3. **Input Handler** - Update local state while user types
4. **Save Handler** - Validate and send PUT request to API
5. **Optimistic Update** - Update local state immediately, sync with server
6. **Success Feedback** - Show toast notification after successful save
7. **Cancel Handler** - Reset editing state and revert changes

Example pattern (editing date field):
```typescript
const [editingId, setEditingId] = useState<string | null>(null);
const [editingDate, setEditingDate] = useState<string>("");

const handleEditDate = (payment: Payment) => {
  setEditingId(payment._id?.toString() || null);
  setEditingDate(payment.date);
};

const handleSaveDate = async () => {
  if (!editingId || !editingDate) return;
  
  try {
    const response = await fetch("/api/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, date: editingDate }),
    });

    if (!response.ok) throw new Error("Failed to update");

    // Optimistic update
    setPayments(prevPayments =>
      prevPayments.map(p =>
        p._id?.toString() === editingId ? { ...p, date: editingDate } : p
      )
    );

    setEditingId(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  } catch (err) {
    setError(err.message);
  }
};

// In JSX - Show input or display based on state
{editingId === payment._id?.toString() ? (
  <input value={editingDate} onChange={(e) => setEditingDate(e.target.value)} />
) : (
  <button onClick={() => handleEditDate(payment)}>
    {formatDate(payment.date)}
  </button>
)}
```

**For multiple fields**: Use separate state variables for each field (`editingTypeId`, `editingType`, `editingDateId`, `editingDate`, etc.). The PUT endpoint can handle multiple field updates by accepting optional parameters and updating only the provided fields.

Example with type field:
```typescript
const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
const [editingType, setEditingType] = useState<string>("");

const handleSaveType = async () => {
  if (!editingTypeId || !editingType) return;
  
  const response = await fetch("/api/payments", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: editingTypeId, type: editingType }),
  });
  
  // Update, show success message, reset state...
};

// In JSX
{editingTypeId === payment._id?.toString() ? (
  <select
    value={editingType}
    onChange={(e) => setEditingType(e.target.value)}
  >
    <option value="income">Income</option>
    <option value="outcome">Outcome</option>
  </select>
) : (
  <button onClick={() => handleEditType(payment)}>
    {payment.type}
  </button>
)}
```

### User Feedback (Toast Notifications)
- Use custom toast notifications instead of browser `alert()` for better UX
- Implement with state management for show/hide control
- Auto-dismiss after 4 seconds with manual close option
- Position fixed at top center of screen
- Include animations for smooth appearance (slide-down effect)
- Use semantic colors matching action type (green for success, red for errors)
- Dark mode support built-in

Example pattern:
```typescript
const [showSuccess, setShowSuccess] = useState(false);

// After successful operation
setShowSuccess(true);
setTimeout(() => setShowSuccess(false), 4000);

// In JSX
{showSuccess && (
  <div className="fixed left-1/2 top-8 z-50 -translate-x-1/2 animate-[slideDown_0.3s_ease-out]">
    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 shadow-lg dark:border-green-800 dark:from-green-950/90 dark:to-emerald-950/90">
      {/* Icon, message, and close button */}
    </div>
  </div>
)}
```

**Animation setup** (in `globals.css`):
```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
```

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

## Validation Patterns

### Server-Side Validation (Required)
```typescript
const { type, date, total, vat } = body;

if (!type || !date || total === undefined || vat === undefined) {
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
const vatAmount = totalAmount - netAmount;
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

## Completed Features & Patterns

### Month Navigation & Filtering
✓ **Completed**: View payments filtered by month with prev/next navigation
- Displays current month by default (1st of current month)
- Navigation buttons to move between months
- Payment summaries (income, outcome, balance) calculated per month
- Formatted month/year display in Spanish locale
- Empty state message when no payments in selected month
- See "Month Navigation Pattern" in Common Tasks & Patterns

### Inline Payment Editing (Date & Type)
✓ **Completed**: Edit date and type via inline editors in payment list
- Added PUT method to `app/api/payments/route.ts` supporting `date` and `type` updates
- Validates `_id` parameter, date field, and type enum
- Frontend uses inline editing with state management for each field
- Optimistic updates for better UX
- Success toast notifications on save
- See "Inline Editing Pattern" in Common Tasks & Patterns

**Next steps**: Extend to edit amount and VAT fields using the same pattern

## Future Development Guidelines

When implementing planned features (from roadmap), follow these patterns:

### Edit Additional Payment Fields
- Extend the inline editing pattern used for date and type to amount/VAT fields
- For amount editing: validate numeric input and handle negative values
- For VAT editing: validate percentage range (0-100) and recalculate net amount
- Update the PUT endpoint to handle new fields alongside existing date/type updates
- Consider field-specific formatters for display (currency for amounts, percentage for VAT)
- Use the established PUT endpoint structure

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
