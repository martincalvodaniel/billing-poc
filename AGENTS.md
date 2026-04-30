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
- **Accessibility**: WCAG 2.1 Level A compliant with ARIA attributes and live regions
- **Dark mode**: Native support with `color-scheme` meta tag

## Architecture Patterns

### Project Structure
```
app/                          # Next.js App Router directory
├── api/payments/route.ts      # RESTful API endpoints
├── components/                # React components
│   ├── DonutChart.tsx         # Reusable donut chart visualization
│   ├── PaymentForm.tsx        # Controlled form component
│   └── PaymentsList.tsx       # Payment display with summary and charts
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
4. **Display** → `PaymentsList.tsx` (fetches all payments, filters by selected month, calculates summaries)
5. **Visualization** → `DonutChart.tsx` (renders tag-based breakdown as donut charts)

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
- **Memoize pure components** with `React.memo()` to prevent unnecessary re-renders

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

### Console Logging
- **Always use template literals** with string interpolation for console output
- **Preferred format**: `console.error(\`Error message: ${error}\`)`
- **Avoid**: `console.error("Error message:", error)` (comma-separated)
- This applies to all console methods: `error`, `log`, `warn`, `info`
- Template literals improve readability and provide better context for debugging

Example:
```typescript
// ✅ Good: Clear, comprehensive error context
console.error(`Error fetching payments: ${error}`);

// ❌ Avoid: Harder to follow error chain
console.error("Error fetching payments:", error);
```

Example error handling:
```typescript
try {
  // operation
} catch (error) {
  console.error(`Context of error: ${error}`);
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
- Add `color-scheme` meta tag in layout for proper dark mode support

### Accessibility Patterns

#### Icon-Only Buttons
All icon buttons MUST have `aria-label` for screen reader users:
```tsx
// ✅ Good: Accessible icon button
<button
  onClick={handleDelete}
  aria-label="Delete payment"
  className="rounded px-2 py-1 text-red-600 hover:text-red-700 
             focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
>
  ✕
</button>

// ❌ Avoid: Missing aria-label
<button onClick={handleDelete} title="Delete">
  ✕
</button>
```

#### Modal Dialogs
Modals require proper ARIA attributes for accessibility:
```tsx
{isOpen && (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="presentation"
    onClick={(e) => {
      if (e.target === e.currentTarget) closeModal();
    }}
  >
    <div 
      className="w-full max-w-sm rounded-lg bg-white shadow-lg"
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div className="border-b px-6 py-4">
        <h3 id="modal-title" className="text-lg font-semibold">
          Modal Title
        </h3>
      </div>
      {/* Modal content */}
    </div>
  </div>
)}
```

**Key attributes**:
- `role="dialog"` on modal container
- `aria-labelledby` pointing to title ID
- `aria-modal="true"` to indicate modal behavior
- `role="presentation"` on backdrop
- Click-outside handler on backdrop

#### Live Regions (Error Messages & Notifications)
Use `aria-live` for dynamic content updates:
```tsx
// Error messages
{error && (
  <div 
    className="rounded-md bg-red-50 p-4 text-sm text-red-800"
    role="alert"
    aria-live="polite"
    aria-atomic="true"
  >
    {error}
  </div>
)}

// Success notifications
{showSuccess && (
  <div 
    className="fixed left-1/2 top-8 z-50 -translate-x-1/2"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <div className="flex items-center gap-3 rounded-lg border bg-green-50 px-6 py-4">
      <svg aria-hidden="true" className="h-5 w-5" {/* ... */}>
        {/* Icon path */}
      </svg>
      <span>Success message</span>
      <button 
        onClick={closeToast}
        aria-label="Close notification"
        className="focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        ✕
      </button>
    </div>
  </div>
)}
```

**Key attributes**:
- `role="alert"` for error messages (assertive)
- `role="status"` for success messages (polite)
- `aria-live="polite"` for automatic announcements
- `aria-atomic="true"` to announce entire message
- `aria-hidden="true"` on decorative SVG icons
- `aria-label` on close buttons

#### Focus Management
All interactive elements need visible focus indicators:
```tsx
// Add focus rings to all buttons and interactive elements
className="rounded px-4 py-2 
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
           dark:focus:ring-offset-zinc-900"
```

#### Expandable Elements
Use `aria-expanded` for collapsible/expandable UI:
```tsx
<button
  onClick={() => setShowCalendar(!showCalendar)}
  aria-label={`Select month, currently viewing ${formatMonthYear(selectedDate)}`}
  aria-expanded={showCalendar}
  className="..."
>
  📅 {formatMonthYear(selectedDate)}
</button>
```

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

### Setting Up Dark Mode Support
Add `color-scheme` meta tag in root layout for proper dark mode support:

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light dark">
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={/* ... */}>
        {children}
      </body>
    </html>
  );
}
```

**Benefits**:
- Native browser controls (scrollbars, inputs) respect dark/light mode
- Scrollbar colors automatically adjust
- Better visual consistency across operating systems
- Improved dark mode experience on Windows

### Creating Reusable Visualization Components
For charts and visualizations that are used in multiple places or are complex:

1. Extract rendering logic into separate component file
2. Accept data and configuration as props (data, title, colors, etc.)
3. Keep component self-contained with all SVG/DOM generation inside
4. Use TypeScript interfaces for props contract
5. Apply styling through Tailwind classes (no CSS files)
6. **Wrap with `React.memo()`** to prevent re-renders when parent updates
7. Export as default and import where needed

Example - DonutChart component:
- **Props**: `data` (Record of tag→amount), `title`, `colors` (string array)
- **Handles**: Full circle (100%) edge case with semicircle rendering
- **Returns**: No-data state or styled donut chart with legend
- **Used in**: `PaymentsList.tsx` for income/outcome breakdown by tag
- **Optimization**: Memoized to prevent re-renders when props unchanged

### Optimizing Component Re-renders
Use `React.memo()` for pure presentational components:

```tsx
import { memo } from 'react';

interface ChartProps {
  data: Record<string, number>;
  title: string;
  colors: string[];
}

// ✅ Memoized component prevents unnecessary re-renders
const DonutChart = memo(function DonutChart({ data, title, colors }: ChartProps) {
  // Component logic
  return (
    <div>
      {/* Chart rendering */}
    </div>
  );
});

export default DonutChart;
```

**When to use memo()**:
- Pure presentational components (same props = same output)
- Components with expensive render calculations
- Components that receive objects/arrays as props frequently
- Components rendered in lists or tables

**When NOT to use memo()**:
- Components that always receive new props
- Components with internal state management
- Already fast components (premature optimization)

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
- **Sticky form fields**: After successful save, keep `type` and `date` fields unchanged (sticky), reset only `total` field to empty. VAT remains at 21%. This improves UX when entering multiple payments of the same type on the same date

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

1. **State Management** - Track selected month with `selectedDate` state (set to 1st of current month) and `showCalendar` state for dropdown visibility. Add `calendarRef` to detect outside clicks
2. **Filter Logic** - Create `getFilteredPayments()` to match payment dates against selected month/year
3. **Calendar Picker** - Render clickable month grid (4 columns) showing all 12 months of the selected year with selection highlighting
4. **Inside Calendar** - Implement prev/next month buttons and year navigation controls
5. **Display Toggle** - Show formatted month/year button with calendar icon (📅) that toggles calendar dropdown
6. **Current Month Shortcut** - Add an icon-only button (e.g., 🎯) to jump back to the current month; disable it when already viewing the current month and close the calendar when used
7. **Click-Outside Behavior** - Attach a `useEffect` hook to detect clicks outside the calendar and close it automatically
8. **Recalculate Summaries** - Update income/outcome/balance based on filtered payments
9. **Empty State** - Show custom message when no payments in selected month

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
  <div className="flex items-center gap-3" ref={calendarRef}>
    <button
      onClick={handleGoToCurrentMonth}
      disabled={isViewingCurrentMonth}
      aria-label="Go to current month"
      className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
    >
      🎯
    </button>
    <div className="relative">
      <button 
        onClick={() => setShowCalendar(!showCalendar)}
        aria-label={`Select month, currently viewing ${formatMonthYear(selectedDate)}`}
        aria-expanded={showCalendar}
        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        📅 {formatMonthYear(selectedDate)}
      </button>
      {showCalendar && renderCalendarPicker()}
    </div>
  </div>
</div>
```

**Features:**
- Calendar dropdown toggles with button click
- Closes automatically when clicking outside the calendar container
- 4-column grid of months for easy selection
- Navigate months while calendar is open with prev/next buttons in header
- Year navigation controls at bottom
- Selected month highlighted in blue for visual feedback
- Click any month to select and auto-close calendar
- Icon-only button jumps to the current month and disables when already there

**Click-Outside Implementation:**
```typescript
const calendarRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!showCalendar) return;

  const handleClickOutside = (event: MouseEvent) => {
    if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
      setShowCalendar(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showCalendar]);
```

Apply `ref={calendarRef}` to the div wrapping both the button and rendered calendar picker.

**Payment Table Display:**
- **Date column**: Shows day only (1-31) since month and year are visible in the calendar picker button, reducing visual clutter
- **VAT column**: Displays as `(percentage%) amount` (e.g., `(21%) €71.24`) on a single line with `whitespace-nowrap` to keep values together

**Summary recalculation** - Use `filteredPayments` instead of all `payments` when calculating totals

**Form Date Synchronization** - When form and list exist in same component tree, sync form date with calendar selection:
```typescript
// In parent component (page.tsx)
const formRef = useRef<{ setFormDate: (dateString: string) => void }>(null);

const handleMonthChange = (dateString: string) => {
  formRef.current?.setFormDate(dateString);
};

// Pass to PaymentsList
<PaymentsList ref={paymentsListRef} onMonthChange={handleMonthChange} />

// In PaymentsList - emit month change event
useEffect(() => {
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
  const day = String(selectedDate.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  onMonthChange?.(dateString);
}, [selectedDate, onMonthChange]);

// In PaymentForm - expose setFormDate method via forwardRef
const PaymentForm = forwardRef(function PaymentForm({ ... }, ref) {
  const [formData, setFormData] = useState<PaymentFormData>({ ... });
  
  useImperativeHandle(ref, () => ({
    setFormDate: (dateString: string) => {
      setFormData((prev) => ({ ...prev, date: dateString }));
    },
  }));
  
  // ... rest of component
});
```
**Key points**:
- Use local timezone for date string formatting (not `toISOString()` which converts to UTC and can shift date backward)
- Format as `YYYY-MM-DD` to match HTML date input expectations
- Form date updates whenever `selectedDate` changes in the calendar

### Modal Editing Pattern (Edit Payment Fields)
For editing individual payment fields using a centered overlay modal:

1. **State Management** - Track which payment is being edited (`editingPaymentId`), which field is being edited (`editingField`), and field values
2. **Modal Trigger** - Clicking a field opens the modal with that field's input
3. **Input Handler** - Update local state while user types (field-specific handlers)
4. **Unified Save Handler** - Validate all field types and send PUT request to API
5. **Optimistic Update** - Update local state immediately, sync with server
6. **Success Feedback** - Show toast notification after successful save
7. **Close Modal** - Reset all editing state when closing (cancel or save)

Key advantage: **No layout shifts** - Table rows stay consistent height. Modal overlays prevent scrolling issues when editing rows near the bottom of a long list.

Example pattern:
```typescript
type EditField = "date" | "type" | "tag" | "total" | "vat" | null;

const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
const [editingField, setEditingField] = useState<EditField>(null);
const [editingDate, setEditingDate] = useState<string>("");
const [editingType, setEditingType] = useState<string>("");
const [editingTotal, setEditingTotal] = useState<string>("");
const [editingVat, setEditingVat] = useState<string>("");

const closeEditModal = () => {
  setEditingPaymentId(null);
  setEditingField(null);
  // Reset all field values
  setEditingDate("");
  setEditingType("");
  setEditingTotal("");
  setEditingVat("");
};

const handleEditDate = (payment: Payment) => {
  setEditingPaymentId(payment._id?.toString() || null);
  setEditingField("date");
  setEditingDate(payment.date);
};

const handleEditType = (payment: Payment) => {
  setEditingPaymentId(payment._id?.toString() || null);
  setEditingField("type");
  setEditingType(payment.type);
};

const handleSave = async () => {
  if (!editingPaymentId || !editingField) return;

  let payload: Record<string, any> = { id: editingPaymentId };

  // Validate and build payload based on field type
  if (editingField === "date") {
    if (!editingDate) {
      setError("Date is required");
      return;
    }
    payload.date = editingDate;
  } else if (editingField === "type") {
    if (!editingType) {
      setError("Type is required");
      return;
    }
    payload.type = editingType;
  }
  // ... handle other fields similarly

  setIsSaving(true);
  try {
    const response = await fetch("/api/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Failed to update ${editingField}`);

    const responseData = await response.json();

    // Optimistic update
    setPayments((prevPayments) =>
      prevPayments.map((p) => {
        if (p._id?.toString() === editingPaymentId) {
          if (editingField === "date") return { ...p, date: editingDate };
          if (editingField === "type") return { ...p, type: editingType as "income" | "outcome" };
          // For total/vat, server returns recalculated values
          return {
            ...p,
            total: responseData.total,
            vat: responseData.vat,
            netAmount: responseData.netAmount,
          };
        }
        return p;
      })
    );

    closeEditModal();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  } catch (err) {
    console.error(`Error updating ${editingField}: ${err}`);
    setError(err instanceof Error ? err.message : "An error occurred");
  } finally {
    setIsSaving(false);
  }
};
```

In JSX - Table rows stay simple with just clickable fields:
```tsx
<tr>
  <td>
    <button onClick={() => handleEditDate(payment)}>
      {formatDate(payment.date)}
    </button>
  </td>
  {/* ... more cells with similar click handlers ... */}
</tr>

{/* Modal Overlay - renders when editingPaymentId && editingField are set */}
{editingPaymentId && editingField && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-sm rounded-lg bg-white shadow-lg">
      <div className="border-b px-6 py-4">
        <h3 className="text-lg font-semibold">
          Edit {editingField.charAt(0).toUpperCase() + editingField.slice(1)}
        </h3>
      </div>
      <div className="space-y-4 px-6 py-4">
        {editingField === "date" && (
          <input
            type="date"
            value={editingDate}
            onChange={(e) => setEditingDate(e.target.value)}
          />
        )}
        {/* ... conditional renders for other field types ... */}
      </div>
      <div className="flex gap-2 border-t px-6 py-4">
        <button onClick={closeEditModal} disabled={isSaving}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
)}
```

**Benefits:**
- ✅ No layout shifts - table rows stay consistent height
- ✅ No scroll jumping - modal is centered on viewport, doesn't affect table position
- ✅ Clean UX - all editing interface is clearly separated from data display
- ✅ Mobile-friendly - responsive modal works on all screen sizes
- ✅ Unified state management - single field type determines modal content

### Tag Field with Autocomplete Pattern (Tags with Type-Based Filtering)
For adding optional tags to payments with intelligent autocomplete suggestions:

1. **State Management** - Track available tags, suggested tags, and display state
2. **Fetch Tags on Mount** - Load available tags filtered by payment type using `GET /api/tags?type=paymentType`
3. **Re-fetch on Type Change** - When payment type changes, refetch tags specific to that type
4. **Debounced Search** - After 1 second of inactivity while typing, filter tags by user input
5. **Case-Insensitive Matching** - Match suggestions regardless of letter case
6. **Display Dropdown** - Show matching suggestions in a dropdown below the input field
7. **Select Tag** - Click suggestion or use keyboard to select and auto-close dropdown
8. **Auto-Update on Save** - Add newly created tags to the available list immediately (no page reload needed)
9. **Type-Specific Tags** - Income and outcome tags remain completely separate

Example pattern:
```typescript
const [availableTags, setAvailableTags] = useState<string[]>([]);
const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
const [showTagSuggestions, setShowTagSuggestions] = useState(false);
const tagDebounceTimer = useRef<NodeJS.Timeout | null>(null);

// Fetch tags for current payment type  
const fetchTagsByType = async (paymentType: string) => {
  try {
    const response = await fetch(`/api/tags?type=${paymentType}`);
    if (response.ok) {
      const data = await response.json();
      setAvailableTags(data.tags || []);
    }
  } catch (err) {
    console.error(`Error fetching tags: ${err}`);
  }
};

useEffect(() => {
  fetchTagsByType(formData.type);
}, [formData.type]); // Re-fetch when type changes

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));

  if (name === "tag") {
    setShowTagSuggestions(true);

    // Clear existing debounce timer
    if (tagDebounceTimer.current) {
      clearTimeout(tagDebounceTimer.current);
    }

    // Set 1-second debounce before showing suggestions
    tagDebounceTimer.current = setTimeout(() => {
      if (value.trim() === "") {
        setSuggestedTags(availableTags);
      } else {
        // Case-insensitive filtering
        const filtered = availableTags.filter((tag) =>
          tag.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestedTags(filtered);
      }
    }, 1000);
  }
};

const handleTagSelect = (tag: string) => {
  setFormData((prev) => ({ ...prev, tag }));
  setShowTagSuggestions(false);
  setSuggestedTags([]);
};

// After successful payment save, add new tag to list
if (formData.tag && !availableTags.includes(formData.tag)) {
  setAvailableTags((prev) => [...prev, formData.tag!].sort());
}

// In JSX - Tag input with suggestions dropdown
<div className="relative space-y-2">
  <label htmlFor="tag" className="block text-sm font-medium">
    Tag (Optional)
  </label>
  <input
    type="text"
    id="tag"
    name="tag"
    value={formData.tag || ""}
    onChange={handleChange}
    onFocus={() => {
      setShowTagSuggestions(true);
      if (!formData.tag?.trim()) {
        setSuggestedTags(availableTags);
      }
    }}
    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
    placeholder="e.g., Client A, Rent, etc."
    className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 focus:ring-2"
  />

  {showTagSuggestions && suggestedTags.length > 0 && (
    <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border bg-white shadow-lg">
      <ul className="max-h-48 overflow-y-auto py-1">
        {suggestedTags.map((tag) => (
          <li key={tag}>
            <button
              type="button"
              onClick={() => handleTagSelect(tag)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100"
            >
              {tag}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>
```

**API Endpoint** - `GET /api/tags` with optional `type` query parameter:
```typescript
// With type filter (income-specific)
const response = await fetch("/api/tags?type=income");
const data = await response.json(); // { tags: ["Client A", "Salary"] }

// Without filter (all tags)
const response = await fetch("/api/tags");
const data = await response.json(); // { tags: ["All", "tags", "combined"] }
```

**Key Features:**
- Type-specific filtering makes income and outcome tags independent
- 1-second debounce prevents excessive filtering operations
- New tags immediately available after save without page reload
- Resets tag field (but not type/date) after successful save
- Dropdown closes automatically after selection with 200ms delay to allow click

### Delete Payment Pattern (Confirmation Modal with Payment Details)
For removing payments with a confirmation overlay that displays payment information:

1. **State Management** - Track which payment is being deleted (`deleteConfirmPaymentId`) and deletion status (`isDeleting`)
2. **Delete Trigger** - Click delete button (×) in payment row to open confirmation modal
3. **Confirmation Modal** - Display payment details (date, type, tag, total) with warning and Cancel/Delete buttons
4. **Delete Handler** - Call DELETE API, update local state, handle errors
5. **Success Feedback** - Show toast notification after successful deletion

Example pattern:
```typescript
// State management
const [deleteConfirmPaymentId, setDeleteConfirmPaymentId] = useState<string | null>(null);
const [isDeleting, setIsDeleting] = useState(false);

// Delete trigger
const handleDeleteClick = (paymentId: string) => {
  setDeleteConfirmPaymentId(paymentId);
};

// Delete handler
const handleConfirmDelete = async () => {
  if (!deleteConfirmPaymentId) return;

  setIsDeleting(true);
  try {
    const response = await fetch("/api/payments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteConfirmPaymentId }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete payment");
    }

    // Remove payment from local state (optimistic update)
    setPayments((prevPayments) =>
      prevPayments.filter((p) => p._id?.toString() !== deleteConfirmPaymentId)
    );

    setDeleteConfirmPaymentId(null);
    setSuccessMessage("Payment deleted successfully");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  } catch (err) {
    console.error(`Error deleting payment: ${err}`);
    setError(err instanceof Error ? err.message : "An error occurred");
    setDeleteConfirmPaymentId(null);
  } finally {
    setIsDeleting(false);
  }
};
```

In JSX - Confirmation modal displays payment info before deletion:
```tsx
{deleteConfirmPaymentId && (() => {
  const paymentToDelete = payments.find(p => p._id?.toString() === deleteConfirmPaymentId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-lg dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Delete Payment
          </h3>
        </div>
        <div className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
          <p>Are you sure you want to delete this payment?</p>
          {paymentToDelete && (
            <div className="mt-4 space-y-3 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Date:</span>
                <span className="font-medium">{formatDate(paymentToDelete.date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Type:</span>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  paymentToDelete.type === "income"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {paymentToDelete.type.charAt(0).toUpperCase() + paymentToDelete.type.slice(1)}
                </span>
              </div>
              {paymentToDelete.tag && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Tag:</span>
                  <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {paymentToDelete.tag}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium">
                <span className="text-zinc-600 dark:text-zinc-400">Total:</span>
                <span>{formatCurrency(paymentToDelete.total)}</span>
              </div>
            </div>
          )}
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <button
            onClick={() => setDeleteConfirmPaymentId(null)}
            disabled={isDeleting}
            className="flex-1 rounded bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
})()}
```

**API Endpoint** - `DELETE /api/payments`:
```typescript
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const result = await db.collection<Payment>("payments").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting payment: ${error}`);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
}
```

**Key Features:**
- Delete button is accessible in table action column
- Confirmation modal prevents accidental deletions
- Payment details (date, type, tag, total) shown in modal for verification
- Optimistic UI update - payment removed immediately from list
- Success toast notification on completion
- Error handling with user-friendly messages
- Loading state disables buttons during deletion
- Modal automatically closes on successful deletion

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

### Accessibility Compliance (WCAG 2.1 Level A)
✓ **Completed**: Full accessibility implementation with ARIA attributes and semantic HTML
- All icon-only buttons have `aria-label` attributes
- Modal dialogs use `role="dialog"`, `aria-labelledby`, and `aria-modal`
- Error messages use `role="alert"` with `aria-live="polite"`
- Success notifications use `role="status"` with `aria-live="polite"`
- Decorative SVG icons have `aria-hidden="true"`
- All interactive elements have visible focus rings with `focus:ring-2`
- Expandable elements use `aria-expanded` for state
- Color-scheme meta tag for native dark mode support
- See "Accessibility Patterns" section for implementation examples

### Payment List View with Summary Cards & Donut Charts
✓ **Completed**: Display all payments with real-time summary calculations and tag-based breakdown visualization
- Summary cards show total income, total outcome, and net balance
- Donut charts visualize income and outcome distribution by tag
- Charts include percentage legends and color-coded segments
- Handles edge case of 100% single tag using semicircle SVG rendering
- Amounts formatted as EUR currency with Spanish locale (es-ES)
- Responsive grid layout (1 column mobile, 3 columns desktop)
- Dynamic calculation based on filtered month selection
- Components: `PaymentsList.tsx` handles display and calculations, `DonutChart.tsx` handles visualization
- See "Month Navigation Pattern" for filtered payment calculations

### Real-Time Payment List Updates
✓ **Completed**: Payment list updates immediately when new payments are created
- Form submission automatically refreshes payment list
- Automatic navigation to the month of the newly created payment
- Uses React state management for instant UI updates
- No polling or WebSocket required for current scope
- Parent component (`page.tsx`) coordinates form saves with list refresh
- Future enhancement: WebSocket implementation for multi-user real-time sync

### Month Navigation & Filtering
✓ **Completed**: View payments filtered by month with prev/next navigation
- Displays current month by default (1st of current month)
- Navigation buttons to move between months
- Payment summaries (income, outcome, balance) calculated per month
- Formatted month/year display in English locale
- Empty state message when no payments in selected month
- **Calendar Picker Features**:
  - 4-column month grid with prev/next navigation
  - Year selection controls
  - Closes automatically when clicking outside the calendar
- **Date Display**: Shows day only (1-31) in payment table since month/year are visible in calendar picker button
- **VAT Display**: Shows as `(percentage%) amount` (e.g., `(21%) €71.24`) on single line for compact display
- **Auto-navigate on save**: Automatically switches to the saved payment's month when a new payment is created
  - `PaymentForm` passes date to `onPaymentSaved` callback
  - `PaymentsList` exposes `navigateToMonth(dateString)` via ref for parent component
  - Parent component (`page.tsx`) calls both `refreshPayments()` and `navigateToMonth(date)` on save
- **Form Date Sync**: Form date field automatically updates to the 1st of the selected month
  - `PaymentsList` accepts optional `onMonthChange` callback prop
  - When calendar month/year changes, `PaymentsList` calls `onMonthChange` with new date in YYYY-MM-01 format
  - Parent (`page.tsx`) handler calls `PaymentForm.setFormDate()` via ref to sync form date
  - `PaymentForm` is a `forwardRef` exposing `setFormDate(dateString)` method via `useImperativeHandle`
  - Improves UX by keeping form date aligned with the month being viewed
- See "Month Navigation Pattern" in Common Tasks & Patterns

### Modal Payment Editing (Date, Type, Tag, Total & VAT)
✓ **Completed**: Edit date, type, tag, total, and VAT via centered overlay modal in payment list
- Added PUT method to `app/api/payments/route.ts` supporting `date`, `type`, `tag`, `total`, and `vat` updates
- Validates `_id` parameter, date field, type enum, and numeric values
- Frontend uses modal overlay with unified state management for all field types
- Optimistic updates for better UX
- Success toast notifications on save
- **Design Benefits**:
  - No layout shifts - table rows maintain consistent height while editing
  - No scroll jumping - modal centered on viewport, doesn't affect table position
  - Clean separation of edit UI from data display
  - Works seamlessly on mobile and desktop
- **Date Editing**: Simple date input in modal, validates non-empty
- **Type Editing**: Dropdown select between "income" and "outcome" in modal
- **Tag Editing Features**:
  - Type-specific autocomplete suggestions (income/outcome tags are separate)
  - 1-second debounce before filtering suggestions
  - Case-insensitive tag matching
  - Dropdown closes automatically after selection
  - New tags automatically added to available list for current session
  - Empty tag field converts to null in database for clean filtering
- **Total Editing**: Number input with decimal step (0.01) in modal
  - Preserves current VAT percentage when total changes
  - Recalculates: `newNetAmount = newTotal / (1 + currentVatPercentage / 100)` and `newVatAmount = newTotal - newNetAmount`
- **VAT Editing**: Number input (0-100%) in modal
  - Validates range 0-100
  - Recalculates: `newNetAmount = currentTotal / (1 + newVatPercentage / 100)` and `newVatAmount = currentTotal - newNetAmount`
  - Calculates displayed VAT percentage from stored VAT amount on edit initiation
- **Window Focus Sync**: PaymentForm automatically refetches tags when window regains focus to stay in sync with PaymentsList edits
- **API Smart Calculation**: PUT endpoint handles both total and VAT updates with proper recalculation logic
- **Unified State Management**: Single `editingField` type determines modal content and validation
- See "Modal Editing Pattern" in Common Tasks & Patterns

### Payment Tags with Type-Based Autocomplete
✓ **Completed**: Add optional tags to categorize payments with intelligent autocomplete
- Added optional `tag` field to `Payment` and `PaymentFormData` types
- **POST `/api/payments`**: Accepts and stores optional tag field
- **GET `/api/tags`**: New endpoint returning unique tags filtered by payment type
  - Uses MongoDB aggregation pipeline for efficient deduplication at database level
  - Query param: `type=income` or `type=outcome` to get type-specific tags
  - Returns all tags if no type specified
  - Filters out empty strings and null values to prevent orphaned tags
- **PUT `/api/payments`**: Supports updating tag alongside date and type fields
  - Converts empty tag strings to null for database storage
  - Only non-empty string tags are returned by GET `/api/tags`
- **Frontend Autocomplete**:
  - Fetches tags on mount and whenever payment type changes (type-based filtering)
  - Additional focus listener refetches tags when window regains focus for sync across components
  - 1-second debounce before showing suggestions while typing
  - Case-insensitive filtering of suggestions
  - Click to select or close suggestions dropdown
  - Selected tags immediately added to available tags list for current session
  - Resets tag field (not type/date) after successful save for better UX
- **Type Separation**: Income and outcome tags are completely independent - users see only relevant tags
- **Inline Tag Editing**: Tags in PaymentsList use same autocomplete pattern as form for consistency
- See "Tag Field with Autocomplete Pattern" and inline editing implementation in Common Tasks & Patterns

### Donut Chart Visualization by Tag
✓ **Completed**: Visualize payment distribution across tags with donut charts
- Two charts: one for income by tag, one for outcome by tag
- Uses SVG path-based rendering for accurate pie/donut segments
- Special handling for 100% single-tag cases (renders as two semicircles)
- Color palette with 10 distinct colors cycling through tags
- Displays percentage distribution with legend below chart
- Shows "No data" state when no payments exist for category
- Used in `PaymentsList.tsx` between summary cards and payment table
- Reusable `DonutChart.tsx` component accepts data, title, and colors
- Responsive design matches summary cards layout (1 col mobile, 2 cols desktop)

### Edit Payment Amount and VAT Fields
✓ **Completed**: Modal editing for total and VAT percentage with automatic recalculation
- **Total Editing via Modal**:
  - Click total amount in payment list to open edit modal
  - Number input with decimal step (0.01) in modal
  - Preserves current VAT percentage when changing total
  - Server recalculates: `newNetAmount = newTotal / (1 + currentVatPercentage / 100)` and `newVatAmount = newTotal - newNetAmount`
  - Optimistic update on client, syncs with server response
  - Success notification on save
- **VAT Percentage Editing via Modal**:
  - Click VAT amount in payment list to open edit modal (displays as percentage calculated from stored VAT amount)
  - Number input with validation (0-100%) in modal
  - Preserves total when changing VAT percentage
  - Server recalculates: `newNetAmount = currentTotal / (1 + newVatPercentage / 100)` and `newVatAmount = currentTotal - newNetAmount`
  - Optimistic update on client, syncs with server response
  - Success notification on save
- **API Implementation**:
  - PUT endpoint accepts `total` and `vat` parameters independently
  - Fetches current payment to maintain relationship between total, VAT%, and net amount
  - Both fields can be updated simultaneously (edits both total and VAT at once)
  - Returns recalculated values: `total`, `vat`, `netAmount` for optimistic client updates
- **Modal State Management**:
  - Unified `editingField` state determines which field modal is editing
  - Single `handleSave` function handles validation and save for all field types
  - Disabled submit during save operation
- See "Modal Editing Pattern" in Common Tasks & Patterns for implementation reference

### Delete Payment with Confirmation Modal
✓ **Completed**: Remove payments with overlay confirmation showing payment details
- **DELETE `/api/payments` Endpoint**:
  - Accepts `id` parameter (MongoDB ObjectId)
  - Validates payment ID exists before deletion
  - Returns success status on deletion
  - Returns 404 if payment not found
- **Confirmation Modal UI**:
  - Centered overlay modal triggered by delete button (✕) in payment table row
  - Displays payment information: date, type, tag (if exists), and total amount
  - Payment info formatted consistently with table display (same colors, badges, currency formatting)
  - Shows warning message: "This action cannot be undone"
  - Cancel and Delete buttons with clear action distinction (red for delete)
- **State Management**:
  - `deleteConfirmPaymentId` - tracks which payment is pending deletion
  - `isDeleting` - loading state during deletion (buttons disabled while processing)
  - Modal only renders when `deleteConfirmPaymentId` is set
- **Delete Handler Functions**:
  - `handleDeleteClick(paymentId)` - Opens confirmation modal
  - `handleConfirmDelete()` - Executes deletion:
    - Calls DELETE API endpoint
    - Removes payment from local state immediately (optimistic update)
    - Shows success toast notification
    - Handles errors gracefully with user-friendly messages
- **UX Features**:
  - Optimistic update - payment disappears immediately, reverts on error
  - Success notification after deletion
  - Error handling with display to user
  - Loading state prevents double-clicks during deletion
  - Modal closes automatically after successful deletion
- See "Delete Payment Pattern" in Common Tasks & Patterns for implementation reference

## Future Development Guidelines

When implementing planned features (from roadmap), follow these patterns:
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
- [ ] **Icon-only buttons have `aria-label` attributes**
- [ ] **Modals have proper ARIA attributes (`role="dialog"`, `aria-labelledby`, `aria-modal`)**
- [ ] **Error/success messages use live regions (`aria-live="polite"`)**
- [ ] **Decorative icons have `aria-hidden="true"`**
- [ ] **Interactive elements have visible focus indicators**
