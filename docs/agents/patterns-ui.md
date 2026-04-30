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

Reusable component for selecting and navigating between months. Used in the Monthly Payments page to provide a unified interface for date filtering.

### Props
```typescript
interface MonthSelectorProps {
  selectedDate: Date;                    // Currently selected date (1st of month)
  onMonthChange: (year: number, month: number) => void;  // Called when month/year changes
  showCalendar: boolean;                 // Whether calendar picker is open
  onShowCalendarChange: (show: boolean) => void;  // Toggle calendar visibility
  isViewingCurrentMonth: boolean;        // Whether currently viewing this month
  onGoToCurrentMonth: () => void;        // Jump to current month callback
}
```

### Features
- Dedicated calendar picker with 12-month grid
- Month/year navigation within the picker
- Manual month selection from grid (closes picker on select)
- Year navigation (prev/next buttons)
- Current month jump button (disables when already viewing current month)
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
const isViewingCurrentMonth = 
  selectedDate.getFullYear() === currentMonthStart.getFullYear() &&
  selectedDate.getMonth() === currentMonthStart.getMonth();

return (
  <MonthSelector
    selectedDate={selectedDate}
    onMonthChange={(year, month) => setSelectedDate(new Date(year, month, 1))}
    showCalendar={showCalendar}
    onShowCalendarChange={setShowCalendar}
    isViewingCurrentMonth={isViewingCurrentMonth}
    onGoToCurrentMonth={() => setSelectedDate(currentMonthStart)}
  />
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

## Modal Editing
- Centered overlay; track editingPaymentId + editingField
- Field-specific validation; unified save handler calling PUT /api/payments
- Optimistic update; success toast; close resets state

## Tag Autocomplete
- Tags are type-specific (income/outcome)
- GET /api/tags?type=...; refetch on type change
- 1s debounce filter; case-insensitive
- Click/keyboard select; close dropdown; add new tag to list after save

## Delete Confirmation
- Delete button opens confirmation modal with payment details
- DELETE /api/payments; optimistic removal; success toast; handles errors

## Toast Notifications
- Custom toasts, top-center; auto-dismiss ~4s; manual close
- Use semantic colors; slideDown animation in globals.css
