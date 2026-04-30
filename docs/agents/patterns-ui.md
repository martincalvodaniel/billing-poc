# UI Patterns

## Page Layout & Design System

### Navigation Bar (All Pages)
Every page includes a consistent navigation bar:
- Structure: Two-column flex layout with `justify-between`
- Styling: `rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900`
- Left section: "Billing" label + page title (e.g., "Monthly Payments", "Yearly Summary")
- Right section: Navigation links with active/inactive states
  - Active: `text-blue-700 hover:bg-blue-50` + `aria-current="page"`
  - Inactive: `text-zinc-700 hover:bg-zinc-100`

### Page Structure (All Pages)
```
<div class="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950">
  <main class="mx-auto max-w-6xl space-y-8 py-12">
    <!-- Navigation bar -->
    <!-- Page header (h1 + subtitle) -->
    <!-- Content sections with space-y-6 -->
  </main>
</div>
```

### Page Header (All Pages)
- Container: `text-center`
- Heading: `text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50`
- Subtitle: `mt-2 text-lg text-zinc-600 dark:text-zinc-400`

### Content Section Cards
- Container: `space-y-6 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900`
- Header: `border-b border-zinc-200 px-6 py-4 dark:border-zinc-800` with title + controls
- Content: `space-y-6 px-6 pb-6`

## Form Handling
- Controlled inputs; validate on submit
- VAT is percentage (0-100), default 21%
- Net = Total / (1 + VAT%/100); VAT amount = Total - Net
- Allow negative totals (refunds); sticky type/date, reset total after save

## Reusable Visualization
- Extract chart logic to components (e.g., DonutChart)
- Props for data/title/colors; no external UI libs
- Memoize pure visual components; stable color mapping

## MonthSelector Component

Reusable component for selecting and navigating between months. Used in the Monthly Payments page to provide a calendar picker for date filtering.

### Props
```typescript
interface MonthSelectorProps {
  selectedDate: Date;                    // Currently selected date (1st of month)
  onMonthChange: (year: number, month: number) => void;  // Called when month/year changes
  showCalendar: boolean;                 // Whether calendar picker is open
  onShowCalendarChange: (show: boolean) => void;  // Toggle calendar visibility
}
```

### Features
- Dedicated calendar picker button with 12-month grid
- Month/year navigation within the picker
- Manual month selection from grid (closes picker on select)
- Year navigation (prev/next buttons)
- Click-outside detection for closing picker
- Dark mode support with consistent styling
- Full keyboard/screen reader accessibility

### Usage Example
```typescript
const [selectedDate, setSelectedDate] = useState(() => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
});
const [showCalendar, setShowCalendar] = useState(false);

const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
return (
  <MonthSelector
    selectedDate={selectedDate}
    onMonthChange={(year, month) => setSelectedDate(new Date(year, month, 1))}
    showCalendar={showCalendar}
    onShowCalendarChange={setShowCalendar
);
```

### Integration Notes
- Used in filter section header of monthly view (app/page.tsx)
- Parent manages selectedDate, showCalendar, and isViewingCurrentMonth state
- onMonthChange callback syncs PaymentForm date field via ref callback
- Place in layout with other filter controls (alongside add-payment button)

## YearSelector Component

Reusable component for selecting and navigating between years. Used in the Yearly Summary page to provide year filtering with manual input.

### Props
```typescript
interface YearSelectorProps {
  selectedYear: number;                  // Currently selected year
  onYearChange: (year: number) => void;  // Called when year changes
  isViewingCurrentYear: boolean;         // Whether currently viewing this year
  onGoToCurrentYear: () => void;         // Jump to current year callback
}
```

### Features
- Prev/next year navigation buttons
- Year picker dropdown (shows 12-year window centered on selected year)
- Manual year input field with Enter key support
- Year grid with active state highlighting
- Current year jump button (disables when already viewing current year)
- Dark mode support with consistent styling
- Full keyboard/screen reader accessibility

### Usage Example
```typescript
const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

const currentYear = useMemo(() => new Date().getFullYear(), []);
const isViewingCurrentYear = selectedYear === currentYear;

return (
  <YearSelector
    selectedYear={selectedYear}
    onYearChange={setSelectedYear}
    isViewingCurrentYear={isViewingCurrentYear}
    onGoToCurrentYear={() => setSelectedYear(currentYear)}
  />
);
```

### Integration Notes
- Used in filter section header of yearly summary view (app/year/page.tsx)
- Parent manages selectedYear and isViewingCurrentYear state
- Updates trigger data refiltering based on paymentsForYear memo
- Place year selector in layout with consistent button styling

## MonthlyBreakdown Component

Reusable component for displaying monthly totals breakdown in year view. Shows income, outcome, and net balance for each month with visual progress bars.

### Props
```typescript
interface MonthlyBreakdownProps {
  monthlyTotals: Array<{    // Calculated monthly totals
    monthIndex: number;     // 0-11 for month
    income: number;         // Total income for month
    outcome: number;        // Total outcome for month
    net: number;            // Net balance (income - outcome)
    totalVolume: number;    // Total volume for bar scaling
  }>;
  selectedYear: number;     // Year for month labels
  formatCurrency: (amount: number) => string;  // Currency formatter
  maxMonthlyVolume: number; // Max volume across all months for bar width
}
```

### Features
- 3-column grid (responsive to 2 columns on mobile)
- Month abbreviation label (Jan, Feb, etc.) — clickable link to month detail page
- Color-coded net balance (blue positive, red negative, gray zero)
- Income/outcome amounts with type-specific colors
- Visual progress bar indicating relative monthly volume
- Dark mode support
- Hover effects on month cards (border highlight, shadow)
- Link-based navigation to `/month?month=X&year=YYYY`

### Integration Notes
- Used in year summary view (app/year/page.tsx) to display monthly breakdown
- Requires pre-computed monthlyTotals with income/outcome/net calculations
- Pass the same formatCurrency function used elsewhere for consistency
- Positioned after DonutChart visualizations in yearly view
- Each month card is wrapped in Next.js Link for client-side navigation
- URL params (month 1-12, year) auto-populate the month page's selectedDate state

## MonthlyPaymentsView Component

Core component for displaying monthly payment list with full CRUD operations. Previously named PaymentsList; renamed to better reflect its role as a monthly-focused view.

### Props
```typescript
interface MonthlyPaymentsViewProps {
  selectedDate: Date;  // Currently selected month (1st of month)
  onMonthChange?: (dateString: string) => void;  // Sync parent form date
  onPaymentsBreakdownChange?: (breakdown: {
    incomeCount: number;
    outcomeCount: number;
  }) => void;  // Update filter header payment counts
}
```

### Forwarded Ref Methods
```typescript
{
  refreshPayments: () => void;  // Fetch latest payments from API
  navigateToMonth: (dateString: string) => void;  // Navigate to payment's month (reserved for future)
  getFilteredPaymentsCount: () => number;  // Get current month payment count
}
```

### Features
- Fetch and filter payments by selected month
- Summary cards (income, outcome, net)
- Donut charts by tag (income/outcome)
- Payment table with editable fields (date, type, tag, total, VAT)
- Modal editing with field-specific validation
- Delete with confirmation modal
- Tag autocomplete (type-specific)
- Success/error toast notifications
- Dark mode support
- Keyboard navigation and accessibility

### Integration Notes
- Used as the main content in monthly view (app/page.tsx)
- Parent manages selectedDate; MonthlyPaymentsView filters by month
- Ref used by parent to refresh list after form save
- onMonthChange callback syncs PaymentForm date field
- onPaymentsBreakdownChange callback updates filter header counter

## Modal Interactions & Keyboard Shortcuts
All modals support consistent keyboard shortcuts for improved UX:
- **ESC**: Cancel/close any modal (same as clicking close button or clicking outside backdrop)
- **ENTER**: Confirm action in modals (save in PaymentForm and edit modal, delete in confirmation, close in detail modal)
- Tag dropdown handling: ENTER selects tag when dropdown is open, submits/saves otherwise
- Implementation uses `useEffect` with keydown listeners; prevents default and propagation
- Listeners use `setTimeout(..., 0)` to ensure DOM is ready before attaching; proper cleanup on unmount
- Modal visibility checks prevent handling keys when modal is not rendered

### Specific Modal Behaviors
- **New Payment Form** (`PaymentForm`): ENTER submits form (skipped if tag dropdown open); ESC closes parent modal via wrapper
- **Payment Detail Modal** (`PaymentDetailModal`): ENTER or ESC closes modal
- **Edit Field Modal** (`MonthlyPaymentsView` edit overlay): ENTER saves field (except tag field), ESC cancels
- **Delete Confirmation Modal** (`MonthlyPaymentsView` delete overlay): ENTER deletes payment, ESC cancels

## Modal Editing
- Centered overlay; track editingPaymentId + editingField
- Field-specific validation; unified save handler calling PUT /api/payments
- Current year button (🎯) is managed by parent and positioned after year selector for consistency with month page
- Updates trigger data refiltering based on paymentsForYear memo
- Payment count display shown adjacent to year in header (e.g., "Overview for 2026 · 45 payments")
- Keyboard support: ENTER key triggers save (finds Save button via XPath), ESC cancels; tag field excludes ENTER from save (allows dropdown selection)
## Tag Autocomplete
- Tags are type-specific (income/outcome)
- GET /api/tags?type=...; refetch on type change
- 1s debounce filter; case-insensitive
- Click/keyboard select; close dropdown; add new tag to list after save

## Delete Confirmation
- Delete button opens confirmation modal with payment details
- DELETE /api/payments; optimistic removal; success toast; handles errors
- Keyboard support: ENTER key deletes payment, ESC closes modal without deleting

## Payment Detail Modal (Read-Only)
- Triggered by an icon-only action button in the monthly payments table
- Use the same overlay, dialog roles, and close interactions as edit/delete modals
- Show high-level fields (date, type chip, tag, total, VAT percentage and amount, net amount)
- List payment components with name, amount, and optional concept-level VAT
- Keep actions minimal (close only); no editing within detail modal
- Component: `PaymentDetailModal` under `app/month/components` with props `{ payment, onClose, formatCurrency? }`

## Toast Notifications
- Custom toasts, top-center; auto-dismiss ~4s; manual close
- Use semantic colors; slideDown animation in globals.css
