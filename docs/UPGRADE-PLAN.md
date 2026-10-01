# Upgrade plan

## Current state

Score: 8/10 (7.5 after pass 2, 7 after pass 1, 6 before) — fail-closed API
client that validates every payload's shape per endpoint, minor-unit sums,
page-level render tests and keyboard focus support, all in CI. Amounts still
arrive from the API as JSON floats.

## Backlog

### P0
- (none open)

### P1
- Ask the Finance API to expose amounts as decimal strings or integer minor
  units; parse them into minor units at the boundary instead of trusting
  `number` (floats) in `src/lib/finance.ts` types.
- Extend `tests/page.test.tsx` to the reconciliation queue, risk readiness
  (`ready` vs `blocked`) and multi-currency portfolio panels.

### P2
- Keep `next`/`eslint-config-next` on the latest 16.3.x patch; re-run `npm audit --omit=dev` each pass.

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

## Done in this pass (pass 3)
- Latest valuation per position uses one rule everywhere
  (`isNewerValuation`): `valuation_as_of` compared as instants (a `+07:00`
  stamp no longer beats a later `Z` stamp by text order), ties to the higher
  id. Valuation coverage used first-seen on ties and text order, so it could
  disagree with the positions table. Test in `finance-contract.test.ts`.
- Page-level render tests (`tests/page.test.tsx`): the async `Home` server
  component is awaited and rendered with `react-dom/server` against a stubbed
  API; covers the setup state, explicit empty states, a partial failure that
  must not look like zero data (checked to fail when the accounts error branch
  is removed), and unpriced holdings. `npm test` now runs through `tsx` (one
  small dev dependency; lockfile written with npm 11 so `libc` fields stay).
- Accessibility: skip link to a focusable `main#main` on every route and a
  visible `:focus-visible` ring.
- Security: `next` and `eslint-config-next` 16.3.2 -> 16.3.8 (fixes
  GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4 and GHSA-vcvr-r3jv-pc5j; the
  refreshed lockfile also clears sharp GHSA-rgj7-g3m4-5g8c). Lockfile
  regenerated with npm 11 (`libc` fields kept); `npm audit --omit=dev`
  reports 0 vulnerabilities.
