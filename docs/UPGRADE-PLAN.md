# Upgrade plan

## Current state

Score: 7/10 (was 6/10) — solid fail-closed API client with good contract
tests; now linted and in CI, with minor-unit money sums. Still no component or
page-level tests and amounts arrive from the API as JSON floats.

## Backlog

### P0
- (none open)

### P1
- Ask the Finance API to expose amounts as decimal strings or integer minor
  units; parse them into minor units at the boundary instead of trusting
  `number` (floats) in `src/lib/finance.ts` types.
- Add render tests for `app/page.tsx` panels (partial-failure, unpriced
  holdings, empty states) with mocked `loadFinanceDashboard` data.
- Runtime-validate API payload shapes (currently cast with `as T`), e.g. items
  arrays and numeric fields, so a contract drift fails closed per endpoint.

### P2
- The transactions table prints "+"/"−" before `formatMoney`; a negative API
  amount would render a double sign. Normalize sign handling.
- Add a skip link and visible `:focus-visible` styles in `globals.css`.
- `npm audit` reports advisories; review and patch within the pinned majors.

## Done in this pass
- Money totals now use `sumMoney` (integer minor units); fixed float drift in
  portfolio value, cost basis, gain/loss, allocations, open invoices, and
  reconciliation differences.
- `formatMoney` no longer renders "-฿0"; reconciliation differences display
  with currency precision (`{ precise: true }`) so 0.30 THB is not shown as 0.
- Added ESLint flat config (`next/core-web-vitals` + TypeScript) and `npm run lint`.
- Added GitHub Actions CI (lint, test, typecheck, build) and `engines.node`.
- Accessibility: decorative glyphs hidden from assistive tech.
- README: corrected Node requirement (22.6+) and stale "not pushed" status.
