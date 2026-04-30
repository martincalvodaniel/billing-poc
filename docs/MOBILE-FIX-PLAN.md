# Mobile Compatibility Fix Plan

## Issue Analysis

### Issue 1 — Responsive Design Broken
**Root cause:** Missing `<meta name="viewport" content="width=device-width, initial-scale=1">` in `app/layout.tsx`.
Without this tag, mobile browsers render at desktop width (~980px), making everything tiny and unresponsive.
**Fix:** Add viewport meta tag to `<head>` in layout.tsx.
**Files:** `app/layout.tsx`

### Issue 2 — Prev/Next Buttons Not Responding
**Root cause:** `MonthSelector.tsx` uses `document.addEventListener("mousedown", handleClickOutside)` to close the calendar dropdown. On mobile touch devices, `mousedown` fires unreliably or interferes with `onClick` propagation. The event fires before the click reaches the button, preventing interaction.
**Fix:** Replace `mousedown` with `pointerdown` (works for both mouse and touch). Same fix needed in `YearSelector.tsx` if it has similar pattern.
**Files:** `app/month/components/MonthSelector.tsx`, `app/year/components/YearSelector.tsx`

### Issue 3 — Add Payment Button Not Showing Modal
**Root cause:** Same `mousedown` event issue. The click-outside handler on MonthSelector/calendar may intercept the touch before `onClick` fires on the add payment button.
**Fix:** Same as Issue 2 — `pointerdown` instead of `mousedown`. Also ensure touch targets meet 44x44px minimum (WCAG 2.5.5).
**Files:** `app/month/components/MonthSelector.tsx`, `app/month/components/MonthPageContent.tsx`

### Issue 4 — No Data Retrieved (Loading Stuck)
**Root cause:** `next dev` binds to `localhost` by default. Mobile device can reach the static HTML (pre-rendered) but API routes at `/api/*` fail because the dev server rejects connections not from localhost.
**Fix:** Change dev script to `next dev --hostname 0.0.0.0` so the server accepts connections from any network interface.
**Files:** `package.json`

## Execution Plan

| Task | Files | Dependencies |
|------|-------|-------------|
| T1: Add viewport meta tag | `app/layout.tsx` | None |
| T2: Fix mousedown → pointerdown | `MonthSelector.tsx`, `YearSelector.tsx` | None |
| T3: Ensure touch targets ≥ 44px | `MonthPageContent.tsx`, `NavButton.tsx` | None |
| T4: Dev server hostname binding | `package.json` | None |

All 4 tasks are independent and can run in parallel.
