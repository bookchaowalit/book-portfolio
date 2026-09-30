# Upgrade plan

## Current state

Score: 7.5/10 (was 7/10 after pass 1, 6/10 before) — fail-closed API client
that now validates every payload's shape per endpoint; linted and in CI with
minor-unit sums. Still no page-level render tests and amounts arrive from the
API as JSON floats.

## Backlog

### P0
- (none open)

### P1
- Ask the Finance API to expose amounts as decimal strings or integer minor
  units; parse them into minor units at the boundary instead of trusting
  `number` (floats) in `src/lib/finance.ts` types.
- Add render tests for `app/page.tsx` panels (needs a TSX-capable runner such
  as Vitest + React Testing Library; `node --experimental-strip-types` cannot
  load `.tsx`): partial-failure, unpriced holdings and empty states with
  mocked `loadFinanceDashboard` data.

### P2
- Add a skip link and visible `:focus-visible` styles in `globals.css`.
- `npm audit` reports advisories; review and patch within the pinned majors.

## Done in pass 1
- Money totals now use `sumMoney` (integer minor units); fixed float drift in
  portfolio value, cost basis, gain/loss, allocations, open invoices, and
  reconciliation differences.
- `formatMoney` no longer renders "-฿0"; reconciliation differences display
  with currency precision (`{ precise: true }`) so 0.30 THB is not shown as 0.
- Added ESLint flat config (`next/core-web-vitals` + TypeScript) and `npm run lint`.
- Added GitHub Actions CI (lint, test, typecheck, build) and `engines.node`.
- Accessibility: decorative glyphs hidden from assistive tech.
- README: corrected Node requirement (22.6+) and stale "not pushed" status.

## Done in this pass (pass 2)
- Every endpoint payload is shape-checked at the boundary (`matchesShape`,
  `assertFinanceSummary`, `assertFinanceRiskReadiness`, per-row shapes for the
  paged lists) instead of trusted via `as T`. Drift (string amounts, non-array
  `items`, unknown readiness status, non-finite numbers) marks only that
  endpoint as failed with a Thai "contract" message; a malformed summary fails
  the dashboard closed. Nullable fields and extra fields remain accepted.
- Transactions table no longer shows a double sign for a negative amount.
- Tests: shape-check unit test and a per-endpoint fail-closed dashboard test.
