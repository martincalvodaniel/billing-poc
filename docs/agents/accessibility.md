# Accessibility Patterns

## Icon Buttons
- All icon-only buttons need aria-label
- Include focus rings (focus:ring-2, offset)

## Modals
- Backdrop role="presentation" with click-outside close
- Dialog role="dialog", aria-labelledby to title id, aria-modal="true"
- Keyboard shortcuts: ESC to close, ENTER/Ctrl+ENTER to confirm
  - Implemented via useEffect with keydown listeners in PaymentDetailModal and PaymentForm
  - Cleanup listeners on unmount to prevent memory leaks

## Live Regions
- Errors: role="alert", aria-live="polite", aria-atomic="true"
- Success: role="status", aria-live="polite", aria-atomic="true"
- Decorative SVGs: aria-hidden="true"
- Close buttons need aria-label

## Focus Management
- Visible focus indicators on all interactive elements

## Expandable Elements
- Use aria-expanded on toggles (e.g., calendar/month picker)
