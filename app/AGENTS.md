# App — UI & Component Guidelines

## Component Architecture
- Functional components with React 19 hooks; PascalCase names, camelCase handlers
- **Shared** components (`app/components/`): reused across pages (DonutChart, Modal, SummaryCard, NavButton, NavigationBar, PageLayout, ClientSelector, Toast)
- **Page-specific** components (`app/[page]/components/`): co-located with their page
- Extract reusable logic into custom hooks (e.g., `usePaymentForm`)
- Memoize pure display components with `React.memo()` and `useMemo`
- Use shared `Toast` component (`app/components/Toast.tsx`) for success notifications — never inline toast JSX
- Use shared `formatCurrency`, `formatDate`, `formatMonthYear` from `lib/formatters.ts` — never define locally
- Use shared `CHART_COLORS` from `lib/constants.ts` — never define color arrays locally

## Data Fetching (SWR)
- All client-side data access goes through SWR hooks in `lib/hooks/` — never call `fetch` directly from a component or `useEffect`.
- GETs: `usePayments`, `useClients`, `useTags` (or add a new `useX` hook following the same pattern: stable tuple key, pure URL builder, `isXKey` predicate).
- Mutations: `useCreatePayment` / `useUpdatePayment` / `useDeletePayment`, `useCreateClient` / `useUpdateClient` / `useDeleteClient`, `useGenerateInvoice` / `useUploadInvoice`. Each `trigger()` invalidates the relevant resource cache automatically.
- Drive loading UI from `isLoading` (queries) or `isMutating` (mutations); surface errors by catching `FetchError` thrown by `trigger()`.
- Do not add manual `mutate(isXKey)` bridges, do not register `window.focus`/`visibilitychange` listeners for re-fetching, do not expose `refresh*` methods via `useImperativeHandle`. Parents trigger revalidation via `useSWRConfig().mutate(isXKey)` if the mutation hook is unavailable in scope.

## PageLayout (Required)
All pages must use `<PageLayout navigationSubtitle headerContent? children />`. Never manually create page structure with `min-h-screen`, `max-w-6xl`, etc.

## Design System
- **Layout**: `mx-auto max-w-6xl space-y-8 py-12`; content sections `space-y-6`
- **Cards**: `rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900`
- **Colors**: zinc base, blue accents (600/700), green (income), red (outcome)
- **Buttons**: blue `bg-blue-600` for primary; zinc borders for nav/secondary; always include `type="button"` on non-submit buttons
- **Focus**: `focus:ring-2 focus:ring-offset-2` on all interactive elements

## Accessibility (WCAG 2.1 A)
- Icon-only buttons: `aria-label` required
- Modals: `role="dialog"`, `aria-labelledby`, `aria-modal="true"`; ESC to close, ENTER to confirm; cleanup keydown listeners on unmount
- Live regions: errors → `role="alert"`, success → `role="status"`, both with `aria-live="polite" aria-atomic="true"`
- Decorative SVGs: `aria-hidden="true"`
- Expandable elements: `aria-expanded` on toggle buttons
- Use `useId()` from React for all element IDs (never static string IDs)

## Forms
- Controlled inputs; validate on submit
- VAT is percentage 0–100, default 21%
- Concepts subtotal is VAT-inclusive base (before surcharge)
- Net = Base / (1 + VAT%/100)
- Surcharge can be negative (e.g., IRPF withholding)
- Surcharge amount = Net * (surcharge%/100)
- Total = Net + VAT amount + Surcharge amount
- Allow negative totals (refunds); sticky type/date after save, reset amounts
