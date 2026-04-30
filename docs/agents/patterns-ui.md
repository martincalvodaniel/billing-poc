# UI Patterns

## Page Layout & Design System

### PageLayout Component (Required for All Pages)

**Location:** `/app/components/PageLayout.tsx`

Shared layout component that enforces consistent structure across all main pages. Use this component instead of manually creating page structure.

**Props:**
```typescript
interface PageLayoutProps {
  title: string;              // Page heading (e.g., "Clients", "Monthly Overview")
  subtitle: string;           // Page description/subtitle
  navigationSubtitle: string; // Label shown in NavigationBar (e.g., "Clients", "Monthly Payments")
  children: React.ReactNode;  // Main page content
  headerContent?: React.ReactNode; // Optional content between header and children (e.g., filters, selectors)
}
```

**Usage Example:**
```tsx
<PageLayout
  title="Clients"
  subtitle="Manage your business contacts and client information"
  navigationSubtitle="Clients"
>
  <div className="space-y-4">
    {/* Page content */}
  </div>
</PageLayout>
```

**With Header Content (Filters/Selectors):**
```tsx
<PageLayout
  title="Yearly Overview"
  subtitle="Explore income and outcome performance"
  navigationSubtitle="Year Summary"
  headerContent={
    <div className="rounded-lg border border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Year selector or other filters */}
    </div>
  }
>
  {/* Page content */}
</PageLayout>
```

**Benefits:**
- Single source of truth for page structure
- Consistent spacing, typography, and dark mode
- Prevents layout drift across pages
- Easy to update layout globally
- Type-safe props enforce consistency

### Navigation Bar (Integrated via PageLayout)
- Structure: Two-column flex layout with `justify-between`
- Styling: `rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900`
- Left section: "Billing" label + page subtitle from props
- Right section: Navigation links with active/inactive states
  - Active: `text-blue-700 hover:bg-blue-50` + `aria-current="page"`
  - Inactive: `text-zinc-700 hover:bg-zinc-100`

### Page Structure (Enforced by PageLayout)
```
<div class="min-h-screen bg-zinc-50 p-4 font-sans dark:bg-zinc-950">
  <main class="mx-auto max-w-6xl space-y-8 py-12">
    <NavigationBar subtitle={navigationSubtitle} />
    <div class="text-center">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
    {headerContent}
    {children}
  </main>
</div>
```

### Page Header (Managed by PageLayout)
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

Reusable component for selecting and navigating between years. Used in the Year Summary page to provide year filtering with manual input.

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
- Used in filter section header of year summary view (app/year/page.tsx)
- Parent manages selectedYear and isViewingCurrentYear state
- Updates trigger data refiltering based on paymentsForYear memo
- Place year selector in layout with consistent button styling

## ClientSelector Component

Reusable component for searching and selecting clients in forms. Provides debounced search, dropdown suggestions, and visual client selection feedback. Used in payment creation and editing to associate a client with a payment.

### Props
```typescript
interface ClientSelectorProps {
  value?: string;           // Client ID (MongoDB ObjectId as string)
  onChange: (clientId: string | undefined, clientName: string | undefined) => void;
  label?: string;           // Optional custom label (default: "Client (Optional)")
  required?: boolean;       // Whether client selection is required (default: false)
}
```

### Features
- Debounced search (300ms) with real-time filtering
- Dropdown suggestions showing client name, tax ID, and type
- Shows first 20 matching clients (pageSize: 20)
- Fetches client by ID on mount if value is provided
- Selected client visual indicator (blue background badge)
- Clear button to remove selection
- Click-outside detection for closing dropdown
- Loading state during API calls
- Empty state messages ("Start typing to search", "No clients found")
- Full keyboard/screen reader accessibility
- Dark mode support with consistent styling

### Usage Example in Forms
```typescript
const [clientId, setClientId] = useState<string | undefined>(undefined);

const handleClientChange = (newClientId: string | undefined, clientName: string | undefined) => {
  setClientId(newClientId);
  // clientName parameter available if needed for display
};

<ClientSelector
  value={clientId}
  onChange={handleClientChange}
  label="Client (Optional)"
  required={false}
/>
```

### API Integration
- GET `/api/clients?search=${query}&pageSize=20` - Search clients by name or tax ID
- Returns paginated response with items array
- Handles both empty search (shows first 20) and filtered search

### Integration Notes
- Used in PaymentForm (app/month/components/PaymentForm.tsx) for creation
- Used in PaymentDetailModal (app/month/components/PaymentDetailModal.tsx) for editing
- Positioned after payment type selector, before date field
- Stores clientId as string (MongoDB ObjectId) in form state
- Sends clientId to API on payment creation/update
- API validates clientId exists before saving
- Clear button allows removing client association

### Styling & Design
- Input field matches form input styling across the app
- Dropdown positioned absolutely below input with z-index handling
- Selected client shows as colored badge (blue-50 background)
- Suggestion items show name (bold) + tax ID and type (smaller text)
- Clear button (×) appears when selection exists
- Consistent spacing and padding with other form controls

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
- Clickable payment table rows open full edit modal
- Modal editing with full payment form (date, type, tag, concepts, VAT)
- Delete with confirmation modal (separate delete button in actions column)
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
- Helper function `hasConceptsWithDifferentVAT()` checks if any concept vat differs from payment vat

## Modal Component (Reusable)

Centralized modal wrapper used across all overlay dialogs. Provides consistent styling, keyboard navigation, accessibility, and backdrop interactions.

### Props
```typescript
interface ModalProps {
  isOpen: boolean;                      // Whether modal is visible
  onClose: () => void;                  // Called when user closes modal
  title: string;                        // Modal title (displayed in header)
  children: React.ReactNode;            // Modal content
  footer?: React.ReactNode;             // Optional footer content (buttons, etc.)
  maxWidth?: "sm" | "md" | "lg";       // Max width (default: "md")
  closeOnEscape?: boolean;              // ESC key closes modal (default: true)
  closeOnEnter?: boolean;               // ENTER key closes modal (default: false)
  closeOnBackdropClick?: boolean;       // Click outside closes modal (default: true)
}
```

### Features
- Consistent backdrop styling (`bg-black/50` semi-transparent)
- Header with title (automatically styled)
- Scrollable content area (`max-h-[90vh]`)
- Optional footer section for custom content
- ESC key support (configurable)
- ENTER key support for read-only modals (optional)
- Click-outside-to-cancel (configurable)
- Full ARIA accessibility with dialog roles
- Dark mode support throughout

### Usage Example
```typescript
import Modal from "@/app/components/Modal";

export default function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        footer={
          <div className="flex gap-2">
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button onClick={handleConfirm}>Confirm</button>
          </div>
        }
      >
        <p>Are you sure you want to proceed?</p>
      </Modal>
    </>
  );
}
```

### Component Location
`app/components/Modal.tsx` - Reusable component used by:
- `MonthPageContent` - New payment creation modal (uses Modal + PaymentForm)
- `PaymentDetailModal` - Payment editing (uses Modal + PaymentFormFields)
- `MonthlyPaymentsView` - Edit field modal + Delete confirmation modal
- `ClientList` - Edit client modal + Delete confirmation modal

## Modal Interactions & Keyboard Shortcuts
All modals use the centralized Modal component for consistent keyboard support:
- **ESC**: Close any modal (same as clicking outside backdrop or close button)
- **ENTER**: Close read-only modals like PaymentDetailModal (configurable per modal)
- Tag dropdown handling: ENTER selects tag when dropdown is open, otherwise handled by modal
- Implementation: Modal component uses `useEffect` with keydown listeners; prevents default and propagation
- Listeners use `setTimeout(..., 0)` to ensure DOM is ready before attaching; proper cleanup on unmount
- Modal visibility checks prevent handling keys when modal is not rendered

### Specific Modal Behaviors
- **PaymentDetailModal** - ENTER or ESC closes (read-only, `closeOnEnter={true}`)
- **Edit Field Modal** (MonthlyPaymentsView) - ENTER saves field (except tag), ESC cancels; Modal handles ESC, special ENTER logic in component
- **Delete Confirmation Modals** - ESC closes without confirming, ENTER in delete button would need focus
- **Edit Client Modal** (ClientList) - ESC closes, ClientForm handles ENTER for submit

## Modal Editing
- Centered overlay; track editPaymentId for full payment edit
- Full form validation; save handler calling PUT /api/payments with all fields (date, type, tag, concepts, vat)
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

## Payment Form Component (Reusable)

Modal-agnostic form component for creating and editing payments. Returns only form fields (no wrapper), allowing flexible modal or standalone usage.

### Location
`app/month/components/PaymentForm.tsx`

### Props
```typescript
interface PaymentFormProps {
  onPaymentSaved?: (date: string) => void;  // Called after successful form submission
}
```

### Exposed Methods (via forwardRef)
```typescript
{
  setFormDate: (dateString: string) => void;  // Update form date field
  submit: () => void;                         // Trigger form submission programmatically
}
```

### Form Fields
- Date (required)
- Type: income | outcome (radio, determines available fields)
- Client (optional, searchable dropdown)
- Concepts (multiple, each with: name, amount, quantity)
- VAT percentage (default: 21%)
- Surcharge percentage (optional)
- Delivery Note Reference (optional)
- Tag (type-specific autocomplete)
- Provider Bill Upload (income only, PDF, max 10MB)

### Features
- Validates all required fields on submit
- Auto-calculates VAT, surcharge, and net amounts
- Tag autocomplete with type-specific filtering (1s debounce)
- Provider bill upload for outcome payments (Optional)
- Success toast notification after save
- Error toast for validation/submission failures
- Sticky type/date across resets (reset only clears concepts, tag, clientId)
- Provider bill file cleared after upload
- Keyboard support: ENTER submits (unless tag dropdown open)

### Integration Notes
- Used in MonthPageContent wrapped in Modal for payment creation
- Used in PaymentDetailModal for payment editing
- Both creation and editing modals follow identical layout/styling
- Form never renders its own submit button (delegated to Modal footer)
- Modal footer provides Cancel and Save buttons using form ref methods
- usePaymentForm hook manages all form state and calculations

## Payment Modal Creation (New Payments)

Payment creation uses the shared Modal component with PaymentForm for consistent UX with payment editing.

### Implementation Details
- Triggered by "Add Payment" button (➕) in monthly view header
- Opens Modal with `title="New Payment"` and `maxWidth="lg"`
- Modal footer with Cancel and Save buttons (uses form ref to submit)
- ESC key or click-outside closes modal
- Form resets after successful save (sticky type/date)
- Success toast notification displayed (auto-hides after 4s)
- Same validation and error handling as edit modals
- Identical styling/layout to PaymentDetailModal for consistency

- Editable fields: date, type, tag, payment components (with add/remove), VAT percentage
- Real-time calculation of totals, VAT amount, and net amount as user edits
- Tag autocomplete with type-specific suggestions
- Save button calls PUT /api/payments with all updated fields
- Component: `PaymentDetailModal` (now editable) under `app/month/components` with props `{ payment, onClose, onUpdate, formatCurrency? }`

## PaginationControls Component

Reusable component for navigating paginated data. Used in the Clients page to provide prev/next navigation and page info display.

### Props
```typescript
interface PaginationControlsProps {
  currentPage: number;           // Current page number (1-indexed)
  totalPages: number;            // Total pages available
  total: number;                 // Total items across all pages
  pageSize: number;              // Items displayed per page
  hasPrevPage: boolean;          // Whether previous page exists
  hasNextPage: boolean;          // Whether next page exists
  onPageChange: (page: number) => void;  // Called when page changes
}
```

### Features
- Previous/Next navigation buttons with disabled states
- Current page / total pages display
- Item count display ("Showing X to Y of Z items")
- Responsive layout (flex column on mobile, flex row on tablet)
- Dark mode support with consistent styling
- Disabled button states prevent navigation beyond bounds
- Keyboard-accessible buttons with aria-labels
- WCAG compliant focus states with focus ring

### Usage Example
```typescript
import PaginationControls from "./components/PaginationControls";

// In clients page component:
const [pagination, setPagination] = useState({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

const handlePageChange = (newPage: number) => {
  fetchClients(searchQuery, newPage);
};

return (
  <>
    {/* Client list content */}
    {pagination.total > 0 && (
      <PaginationControls
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        pageSize={pagination.pageSize}
        hasPrevPage={pagination.hasPrevPage}
        hasNextPage={pagination.hasNextPage}
        onPageChange={handlePageChange}
      />
    )}
  </>
);
```

### Integration Notes
- Used in clients list view (app/clients/page.tsx) to paginate client results
- Parent manages pagination state and passes it to API on page change
- API returns paginated response with both items and pagination metadata
- Reset to page 1 when search term changes (prevent landing on non-existent page)
- Only display pagination controls if total > 0 (hide for empty results)
- Card styling matches other content cards for consistent UX

## ClientList Component & Client Modal Editing

Component for displaying paginated client list with full CRUD operations (create via separate form, edit/delete via modals).

### Features
- Clickable table rows that open edit modal
- Edit modal with client form fields (type, name, tax ID, address, phone, email)
- Delete confirmation modal with client details
- Modal keyboard support: **ESC** to close edit/delete modals, **Click outside backdrop** to cancel
- Dark mode support with consistent styling
- Responsive table layout

### Modal Styling Pattern
All client modals follow the same pattern as payment modals:
- **Backdrop**: `bg-black/50` (semi-transparent black overlay)
- **Overlay Container**: `fixed inset-0 z-50 flex items-center justify-center`
- **Click Outside**: Clicking the backdrop outside the modal closes it
- **Dialog Structure**: Header with title + border, content area, footer with buttons
- **Keyboard Shortcuts**: ESC closes modals, properly tracked with useEffect and visibility checks

### Client Form Modal
- Displayed when user clicks any client table row
- Edit form with all client fields (optional: phone, email)
- Cancel button or ESC key closes modal without saving
- Save button submits PUT request to `/api/clients`
- Error handling with inline error messages
- Success automatically refreshes client list

### Delete Confirmation Modal
- Displayed when user clicks Delete button in Actions column
- Shows client name and tax ID for confirmation
- Cancel button or clicking outside closes without deleting
- Delete button confirms destructive action with DELETE request
- Success automatically refreshes client list
- Error handling displays error messages

### Integration Notes
- Used in clients list view (app/clients/page.tsx)
- Parent manages client array and passes onRefresh callback
- useEffect hooks handle ESC key detection for both modals
- Modal visibility determined by editingClientId and deletingClientId state
- ClientForm component handles validation and submission

## Toast Notifications
- Custom toasts, top-center; auto-dismiss ~4s; manual close
- Use semantic colors; slideDown animation in globals.css
