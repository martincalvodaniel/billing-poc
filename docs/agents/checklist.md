# Summary Checklist

- Code respects TypeScript strict mode
- Types defined/imported from lib/types.ts; no any without guard
- API endpoints validate inputs and return NextResponse.json with proper status
- Errors logged with template literals
- Styling uses Tailwind utilities only
- Components functional with React hooks; semantic HTML
- Linting passes (bun run lint)
- Architecture patterns preserved
- Icon-only buttons have aria-label
- Modals: role="dialog", aria-labelledby, aria-modal
- Alerts/status use aria-live; decorative icons aria-hidden
- Focus indicators present
