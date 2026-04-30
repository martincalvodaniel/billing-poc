# Mobile Summary/Charts Display — Future Alternatives

**Current**: Single collapsible accordion wrapping both Summary Cards and Donut Charts. Collapsed by default on mobile (`< 640px`), expanded on desktop.

## Alternative strategies to consider

### 1. Toggle button (show/hide)
- Hidden by default on mobile with a floating "Show Summary" button
- Pros: Cleaner initial view, explicit user intent
- Cons: Extra floating UI element

### 2. Compact horizontal scroll
- Render summary cards as horizontal scrollable chips on mobile
- Charts could become mini sparklines instead of full donut charts
- Pros: Always visible, compact
- Cons: More complex implementation, less readable

### 3. Hide entirely on mobile
- Use `hidden sm:block` to only show on desktop
- Pros: Simplest, maximum space for table
- Cons: Users lose access to summary data on mobile

### 4. Two separate collapsibles
- Independent toggles for Summary Cards and Donut Charts
- Pros: Granular control, user can show one without the other
- Cons: More buttons, slightly more complex UI

## Switching instructions
The collapsible is implemented in `app/components/CollapsibleSection.tsx`. To change strategy, modify `MonthlyPaymentsView.tsx` where `<CollapsibleSection>` wraps `<PaymentsSummary>` and `<PaymentCharts>`.
