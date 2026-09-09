import assert from "node:assert/strict";
import test from "node:test";
import {
  FINANCE_SCHEMA_VERSION,
  buildFinancePortfolioPositions,
  formatDate,
  formatDateTime,
  formatMoney,
  isReportingPeriod,
  loadFinanceDashboard,
  resolveReportingPeriod,
  statusLabel,
  summarizeFinancePortfolio,
  summarizeFinanceReconciliations,
  summarizeFinanceSignals,
  summarizeFinanceValuationCoverage,
  transactionLabel,
} from "../src/lib/finance.ts";

test("frontend pins the BookFinance v1 schema", () => {
  assert.equal(FINANCE_SCHEMA_VERSION, "finance.v1");
});

test("money formatting keeps currencies explicit", () => {
  assert.match(formatMoney(1234, "THB"), /฿|THB/);
  assert.match(formatMoney(1234, "USD"), /\$|USD/);
});

test("display helpers handle API read-model values", () => {
  assert.equal(transactionLabel("income"), "รายรับ");
  assert.equal(transactionLabel("expense"), "รายจ่าย");
  assert.equal(statusLabel("paid"), "จ่ายแล้ว");
  assert.equal(formatDate("2026-08-24"), "24 ส.ค. 2569");
  assert.equal(formatDate(null), "—");
  assert.match(formatDateTime("2026-08-31T16:00:00Z"), /31 ส.ค. 2569/);
});

test("reporting period selection accepts only calendar months", () => {
  assert.equal(isReportingPeriod("2026-08"), true);
  assert.equal(isReportingPeriod("2026-13"), false);
  assert.equal(isReportingPeriod("2026-8"), false);
  assert.equal(resolveReportingPeriod(" 2025-12 "), "2025-12");
});

test("control signals aggregate only the preferred currency and open invoices", () => {
  const signals = summarizeFinanceSignals({
    schema_version: FINANCE_SCHEMA_VERSION,
    service: "book-finance-api",
    period: "2026-08",
    source_of_truth: "sqlite.finance_control_plane",
    transactions: [{ currency: "THB", count: 2, income: 1000, expense: 250, net: 750 }],
    revenue: [{ currency: "THB", count: 2, total: 1300, received: 1000, pending: 300 }],
    invoices: [
      { status: "paid", currency: "THB", count: 1, amount: 1000 },
      { status: "pending", currency: "THB", count: 2, amount: 300 },
      { status: "cancelled", currency: "THB", count: 1, amount: 50 },
      { status: "pending", currency: "USD", count: 4, amount: 400 },
    ],
    accounts: { active: 1 },
    liabilities: [{ currency: "THB", count: 2, outstanding: 175 }],
  });

  assert.deepEqual(signals, {
    currency: "THB",
    revenueReceived: 1000,
    revenuePending: 300,
    liabilityOutstanding: 175,
    liabilityCount: 2,
    openInvoiceAmount: 300,
    openInvoiceCount: 2,
  });
});

test("portfolio snapshot excludes other currencies and unpriced positions from known valuation", () => {
  const snapshot = summarizeFinancePortfolio([
    {
      id: 1,
      name: "Fund",
      investment_type: "fund",
      owner_scope: "personal",
      account_id: 1,
      quantity: 10,
      cost_basis: 500,
      current_value: 650,
      currency: "THB",
      acquired_on: "2026-01-01",
      status: "active",
    },
    {
      id: 2,
      name: "Crypto",
      investment_type: "crypto",
      owner_scope: "personal",
      account_id: 1,
      quantity: 1,
      cost_basis: 100,
      current_value: null,
      currency: "THB",
      acquired_on: "2026-02-01",
      status: "active",
    },
    {
      id: 3,
      name: "USD stock",
      investment_type: "stock",
      owner_scope: "personal",
      account_id: 1,
      quantity: 2,
      cost_basis: 800,
      current_value: 1000,
      currency: "USD",
      acquired_on: "2026-03-01",
      status: "active",
    },
    {
      id: 4,
      name: "Closed fund",
      investment_type: "fund",
      owner_scope: "personal",
      account_id: 1,
      quantity: 2,
      cost_basis: 100,
      current_value: 120,
      currency: "THB",
      acquired_on: "2025-01-01",
      status: "closed",
    },
  ]);

  assert.deepEqual(snapshot, {
    currency: "THB",
    activePositions: 2,
    pricedPositions: 1,
    unpricedPositions: 1,
    costBasis: 600,
    currentValue: 650,
    unrealizedGainLoss: null,
    allocations: [
      { investmentType: "fund", count: 1, currentValue: 650 },
      { investmentType: "crypto", count: 1, currentValue: 0 },
    ],
  });
});

test("portfolio projection prefers the latest valuation snapshot and fails closed on an unpriced snapshot", () => {
  const investments = [
    {
      id: 1,
      name: "Fund",
      investment_type: "fund",
      owner_scope: "personal",
      account_id: 1,
      quantity: 10,
      cost_basis: 500,
      current_value: 550,
      currency: "THB",
      acquired_on: "2026-01-01",
      status: "active",
    },
    {
      id: 2,
      name: "Unpriced holding",
      investment_type: "stock",
      owner_scope: "personal",
      account_id: 1,
      quantity: 2,
      cost_basis: 700,
      current_value: 800,
      currency: "THB",
      acquired_on: "2026-02-01",
      status: "active",
    },
  ];
  const valuations = [
    {
      id: 1,
      investment_id: 1,
      investment_name: "Fund",
      market_price_snapshot_id: 1,
      quantity: 10,
      market_value: 600,
      currency: "THB",
      valuation_as_of: "2026-08-30T16:00:00Z",
      valuation_method: "market_price",
      coverage_status: "covered",
      market_price: 60,
      market_price_currency: "THB",
      market_price_as_of: "2026-08-30T16:00:00Z",
      market_price_source_type: "broker",
      market_price_quality: "verified",
    },
    {
      id: 2,
      investment_id: 1,
      investment_name: "Fund",
      market_price_snapshot_id: 2,
      quantity: 10,
      market_value: 650,
      currency: "THB",
      valuation_as_of: "2026-08-31T16:00:00Z",
      valuation_method: "market_price",
      coverage_status: "covered",
      market_price: 65,
      market_price_currency: "THB",
      market_price_as_of: "2026-08-31T16:00:00Z",
      market_price_source_type: "broker",
      market_price_quality: "verified",
    },
    {
      id: 3,
      investment_id: 2,
      investment_name: "Unpriced holding",
      market_price_snapshot_id: null,
      quantity: 2,
      market_value: null,
      currency: "THB",
      valuation_as_of: "2026-08-31T16:00:00Z",
      valuation_method: "unpriced",
      coverage_status: "unpriced",
      market_price: null,
      market_price_currency: null,
      market_price_as_of: null,
      market_price_source_type: null,
      market_price_quality: null,
    },
    {
      id: 4,
      investment_id: 1,
      investment_name: "Fund",
      market_price_snapshot_id: 4,
      quantity: 10,
      market_value: 9999,
      currency: "USD",
      valuation_as_of: "2026-09-01T16:00:00Z",
      valuation_method: "market_price",
      coverage_status: "covered",
      market_price: 999.9,
      market_price_currency: "USD",
      market_price_as_of: "2026-09-01T16:00:00Z",
      market_price_source_type: "broker",
      market_price_quality: "verified",
    },
  ];

  const positions = buildFinancePortfolioPositions(investments, valuations);
  assert.deepEqual(
    positions.map(({ investmentId, currentValue, valuationAsOf, valuationSource }) => ({
      investmentId,
      currentValue,
      valuationAsOf,
      valuationSource,
    })),
    [
      { investmentId: 1, currentValue: 650, valuationAsOf: "2026-08-31T16:00:00Z", valuationSource: "snapshot" },
      { investmentId: 2, currentValue: null, valuationAsOf: "2026-08-31T16:00:00Z", valuationSource: "snapshot" },
    ],
  );

  const summary = summarizeFinancePortfolio(investments, valuations);
  assert.equal(summary.currentValue, 650);
  assert.equal(summary.pricedPositions, 1);
  assert.equal(summary.unpricedPositions, 1);
  assert.equal(summary.unrealizedGainLoss, null);
});

test("reconciliation signals isolate unresolved differences in the preferred currency", () => {
  const signals = summarizeFinanceReconciliations([
    {
      id: 1,
      account_id: 1,
      period_start: "2026-08-01",
      period_end: "2026-08-31",
      source_type: "bank_statement",
      expected_amount: 1000,
      reconciled_amount: 900,
      difference_amount: 100,
      currency: "THB",
      status: "open",
      reconciled_at: null,
    },
    {
      id: 2,
      account_id: 1,
      period_start: "2026-08-01",
      period_end: "2026-08-31",
      source_type: "manual",
      expected_amount: 500,
      reconciled_amount: 520,
      difference_amount: -20,
      currency: "THB",
      status: "exception",
      reconciled_at: null,
    },
    {
      id: 3,
      account_id: 1,
      period_start: "2026-07-01",
      period_end: "2026-07-31",
      source_type: "bank_statement",
      expected_amount: 300,
      reconciled_amount: 300,
      difference_amount: 0,
      currency: "THB",
      status: "matched",
      reconciled_at: "2026-08-02T00:00:00Z",
    },
    {
      id: 4,
      account_id: 1,
      period_start: "2026-08-01",
      period_end: "2026-08-31",
      source_type: "wallet_export",
      expected_amount: 50,
      reconciled_amount: 0,
      difference_amount: 50,
      currency: "USD",
      status: "open",
      reconciled_at: null,
    },
  ]);

  assert.deepEqual(signals, {
    currency: "THB",
    openCount: 1,
    exceptionCount: 1,
    matchedCount: 1,
    unresolvedDifference: 80,
  });
});

test("valuation coverage keeps only the latest snapshot per position", () => {
  const coverage = summarizeFinanceValuationCoverage([
    {
      id: 1,
      investment_id: 10,
      investment_name: "Fund",
      market_price_snapshot_id: 1,
      quantity: 10,
      market_value: 600,
      currency: "THB",
      valuation_as_of: "2026-08-30T16:00:00Z",
      valuation_method: "market_price",
      coverage_status: "covered",
      market_price: 60,
      market_price_currency: "THB",
      market_price_as_of: "2026-08-30T16:00:00Z",
      market_price_source_type: "broker",
      market_price_quality: "verified",
    },
    {
      id: 2,
      investment_id: 10,
      investment_name: "Fund",
      market_price_snapshot_id: 2,
      quantity: 10,
      market_value: 650,
      currency: "THB",
      valuation_as_of: "2026-08-31T16:00:00Z",
      valuation_method: "market_price",
      coverage_status: "covered",
      market_price: 65,
      market_price_currency: "THB",
      market_price_as_of: "2026-08-31T16:00:00Z",
      market_price_source_type: "broker",
      market_price_quality: "verified",
    },
    {
      id: 3,
      investment_id: 11,
      investment_name: "Crypto",
      market_price_snapshot_id: null,
      quantity: 1,
      market_value: null,
      currency: "THB",
      valuation_as_of: "2026-08-31T16:00:00Z",
      valuation_method: "unpriced",
      coverage_status: "unpriced",
      market_price: null,
      market_price_currency: null,
      market_price_as_of: null,
      market_price_source_type: null,
      market_price_quality: null,
    },
    {
      id: 4,
      investment_id: 12,
      investment_name: "USD stock",
      market_price_snapshot_id: 4,
      quantity: 2,
      market_value: 100,
      currency: "USD",
      valuation_as_of: "2026-08-31T16:00:00Z",
      valuation_method: "market_price",
      coverage_status: "covered",
      market_price: 50,
      market_price_currency: "USD",
      market_price_as_of: "2026-08-31T16:00:00Z",
      market_price_source_type: "exchange",
      market_price_quality: "verified",
    },
  ]);

  assert.deepEqual(coverage, {
    currency: "THB",
    positionCount: 2,
    coveredPositions: 1,
    verifiedPositions: 1,
    stalePositions: 0,
    unpricedPositions: 1,
    latestAsOf: "2026-08-31T16:00:00Z",
  });
});

test("dashboard consumer uses only the authenticated finance read model", async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.FINANCE_API_TOKEN;
  const originalBaseUrl = process.env.FINANCE_API_BASE_URL;
  const originalPeriod = process.env.FINANCE_DASHBOARD_PERIOD;
  const requests: Array<{ url: string; authorization: string | null }> = [];

  process.env.FINANCE_API_TOKEN = "test-token";
  process.env.FINANCE_API_BASE_URL = "http://finance.test";
  process.env.FINANCE_DASHBOARD_PERIOD = "2026-08";
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    requests.push({
      url,
      authorization: new Headers(init?.headers).get("Authorization"),
    });
    const isSummary = url.includes("/summary?");
    const isRiskReadiness = url.includes("/risk-readiness");
    const body = isSummary
      ? {
          schema_version: FINANCE_SCHEMA_VERSION,
          service: "book-finance-api",
          period: "2026-08",
          source_of_truth: "sqlite.finance_control_plane",
          transactions: [{ currency: "THB", count: 1, income: 100, expense: 25, net: 75 }],
          revenue: [],
          invoices: [],
          accounts: { active: 1 },
          liabilities: [],
        }
      : isRiskReadiness
      ? {
          schema_version: FINANCE_SCHEMA_VERSION,
          service: "book-finance-api",
          source_of_truth: "sqlite.finance_control_plane.finance_valuation_snapshots",
          contract_version: "finance.valuation-risk.v1",
          policy_version: "finance-risk-input-policy.v1",
          metric_definitions_version: "finance-risk-metric-definitions.v1",
          metric_definitions_status: "pending_owner_review",
          fx_contract_version: "finance.fx-snapshot.v1",
          fx_contract_status: "proposed-pending-owner-review",
          status: "blocked",
          risk_engine_enabled: false,
          evaluation_as_of: "2026-09-06T00:00:00Z",
          currency: "THB",
          total_positions: 0,
          eligible_positions: 0,
          coverage_ratio: 0,
          stale_positions: 0,
          unverified_positions: 0,
          missing_positions: 0,
          latest_valuation_as_of: null,
          freshness_max_age_hours: { broker: 24 },
          fx_policy: "single_currency_only",
          metrics: {
            volatility: "not_enabled",
            concentration: "not_enabled",
            liquidity: "not_enabled",
            drawdown: "not_enabled",
          },
          reason_codes: ["NO_VALUATION_SNAPSHOTS", "RISK_METRICS_NOT_ENABLED"],
        }
      : {
          schema_version: FINANCE_SCHEMA_VERSION,
          service: "book-finance-api",
          source_of_truth: "sqlite.finance_control_plane",
          items: [],
          limit: 8,
          offset: 0,
          next_cursor: null,
        };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json", "X-Request-ID": "test-request" },
    });
  };

  try {
    const dashboard = await loadFinanceDashboard("2025-12");
    assert.equal(dashboard.ok, true);
    assert.ok(requests.some((request) => request.url.endsWith("/summary?period=2025-12")));
    assert.ok(requests.some((request) => request.url.endsWith("/valuations?status=active&latest=true&limit=12&offset=0")));
    assert.ok(requests.some((request) => request.url.endsWith("/investments?status=active&limit=12&offset=0")));
    assert.equal(requests.length, 8);
    assert.ok(requests.every((request) => request.authorization === "Bearer test-token"));
    assert.ok(requests.every((request) => request.url.startsWith("http://finance.test/api/finance/v1/")));
    if (dashboard.ok) {
      assert.deepEqual(
        Object.fromEntries(Object.entries(dashboard.endpointStatuses).map(([key, value]) => [key, value.status])),
        {
          summary: "ok",
          transactions: "ok",
          accounts: "ok",
          investments: "ok",
          reconciliations: "ok",
          valuations: "ok",
          riskReadiness: "ok",
          invoices: "ok",
        },
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.FINANCE_API_TOKEN;
    else process.env.FINANCE_API_TOKEN = originalToken;
    if (originalBaseUrl === undefined) delete process.env.FINANCE_API_BASE_URL;
    else process.env.FINANCE_API_BASE_URL = originalBaseUrl;
    if (originalPeriod === undefined) delete process.env.FINANCE_DASHBOARD_PERIOD;
    else process.env.FINANCE_DASHBOARD_PERIOD = originalPeriod;
  }
});

test("dashboard follows pagination for complete portfolio reads", async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.FINANCE_API_TOKEN;
  const originalBaseUrl = process.env.FINANCE_API_BASE_URL;
  const requests: string[] = [];

  const investment = (id: number): Record<string, unknown> => ({
    id,
    name: `Holding ${id}`,
    investment_type: "fund",
    owner_scope: "personal",
    account_id: 1,
    quantity: 1,
    cost_basis: 100,
    current_value: 110,
    currency: "THB",
    acquired_on: "2026-01-01",
    status: "active",
  });
  const valuation = (id: number): Record<string, unknown> => ({
    id,
    investment_id: id,
    investment_name: `Holding ${id}`,
    market_price_snapshot_id: id,
    quantity: 1,
    market_value: 110,
    currency: "THB",
    valuation_as_of: "2026-08-31T16:00:00Z",
    valuation_method: "market_price",
    coverage_status: "covered",
    market_price: 110,
    market_price_currency: "THB",
    market_price_as_of: "2026-08-31T16:00:00Z",
    market_price_source_type: "broker",
    market_price_quality: "verified",
  });
  const paged = (items: Record<string, unknown>[], offset: number, nextCursor: string | null) => ({
    schema_version: FINANCE_SCHEMA_VERSION,
    service: "book-finance-api",
    source_of_truth: "sqlite.finance_control_plane",
    items,
    limit: 12,
    offset,
    next_cursor: nextCursor,
  });
  const summary = {
    schema_version: FINANCE_SCHEMA_VERSION,
    service: "book-finance-api",
    period: "2026-08",
    source_of_truth: "sqlite.finance_control_plane",
    transactions: [],
    revenue: [],
    invoices: [],
    accounts: { active: 1 },
    liabilities: [],
  };
  const riskReadiness = {
    schema_version: FINANCE_SCHEMA_VERSION,
    service: "book-finance-api",
    source_of_truth: "sqlite.finance_control_plane.finance_valuation_snapshots",
    contract_version: "finance.valuation-risk.v1",
    policy_version: "finance-risk-input-policy.v1",
    metric_definitions_version: "finance-risk-metric-definitions.v1",
    metric_definitions_status: "pending_owner_review",
    fx_contract_version: "finance.fx-snapshot.v1",
    fx_contract_status: "proposed-pending-owner-review",
    status: "blocked",
    risk_engine_enabled: false,
    evaluation_as_of: "2026-09-06T00:00:00Z",
    currency: "THB",
    total_positions: 13,
    eligible_positions: 13,
    coverage_ratio: 1,
    stale_positions: 0,
    unverified_positions: 0,
    missing_positions: 0,
    latest_valuation_as_of: "2026-08-31T16:00:00Z",
    freshness_max_age_hours: { broker: 24 },
    fx_policy: "single_currency_only",
    metrics: { volatility: "not_enabled", concentration: "not_enabled", liquidity: "not_enabled", drawdown: "not_enabled" },
    reason_codes: ["RISK_METRICS_NOT_ENABLED"],
  };

  process.env.FINANCE_API_TOKEN = "test-token";
  process.env.FINANCE_API_BASE_URL = "http://finance.test";
  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    const parsed = new URL(url);
    const offset = Number(parsed.searchParams.get("offset") || 0);
    let body: unknown;
    if (url.includes("/summary?")) body = summary;
    else if (url.includes("/risk-readiness")) body = riskReadiness;
    else if (url.includes("/investments?")) {
      body = paged(offset === 0 ? Array.from({ length: 12 }, (_, index) => investment(index + 1)) : [investment(13)], offset, offset === 0 ? "12" : null);
    } else if (url.includes("/valuations?")) {
      body = paged(offset === 0 ? Array.from({ length: 12 }, (_, index) => valuation(index + 1)) : [valuation(13)], offset, offset === 0 ? "12" : null);
    } else {
      body = paged([], offset, null);
    }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json", "X-Request-ID": `request-${requests.length}` },
    });
  };

  try {
    const dashboard = await loadFinanceDashboard("2026-08");
    assert.equal(dashboard.ok, true);
    if (!dashboard.ok) return;
    assert.equal(dashboard.investments.length, 13);
    assert.equal(dashboard.valuations.length, 13);
    assert.ok(requests.some((url) => url.endsWith("/investments?status=active&limit=12&offset=12")));
    assert.ok(requests.some((url) => url.endsWith("/valuations?status=active&latest=true&limit=12&offset=12")));
    assert.equal(dashboard.requestIds.length, 10);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.FINANCE_API_TOKEN;
    else process.env.FINANCE_API_TOKEN = originalToken;
    if (originalBaseUrl === undefined) delete process.env.FINANCE_API_BASE_URL;
    else process.env.FINANCE_API_BASE_URL = originalBaseUrl;
  }
});

test("dashboard exposes a partial endpoint failure without presenting it as empty data", async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.FINANCE_API_TOKEN;
  const originalBaseUrl = process.env.FINANCE_API_BASE_URL;
  let valuationFailure: "timeout" | "cursor" = "timeout";

  process.env.FINANCE_API_TOKEN = "test-token";
  process.env.FINANCE_API_BASE_URL = "http://finance.test";
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/valuations?") && valuationFailure === "timeout") throw new Error("synthetic valuation timeout");
    if (url.includes("/valuations?") && valuationFailure === "cursor") {
      return new Response(JSON.stringify({
        schema_version: FINANCE_SCHEMA_VERSION,
        service: "book-finance-api",
        source_of_truth: "sqlite.finance_control_plane",
        items: [],
        limit: 12,
        offset: 0,
        next_cursor: "not-an-offset",
      }), {
        status: 200,
        headers: { "content-type": "application/json", "X-Request-ID": "bad-cursor-request" },
      });
    }
    const body = url.includes("/summary?")
      ? {
          schema_version: FINANCE_SCHEMA_VERSION,
          service: "book-finance-api",
          period: "2026-08",
          source_of_truth: "sqlite.finance_control_plane",
          transactions: [],
          revenue: [],
          invoices: [],
          accounts: { active: 0 },
          liabilities: [],
        }
      : url.includes("/risk-readiness")
      ? {
          schema_version: FINANCE_SCHEMA_VERSION,
          service: "book-finance-api",
          source_of_truth: "sqlite.finance_control_plane.finance_valuation_snapshots",
          contract_version: "finance.valuation-risk.v1",
          policy_version: "finance-risk-input-policy.v1",
          metric_definitions_version: "finance-risk-metric-definitions.v1",
          metric_definitions_status: "pending_owner_review",
          fx_contract_version: "finance.fx-snapshot.v1",
          fx_contract_status: "proposed-pending-owner-review",
          status: "blocked",
          risk_engine_enabled: false,
          evaluation_as_of: "2026-09-06T00:00:00Z",
          currency: "THB",
          total_positions: 0,
          eligible_positions: 0,
          coverage_ratio: 0,
          stale_positions: 0,
          unverified_positions: 0,
          missing_positions: 0,
          latest_valuation_as_of: null,
          freshness_max_age_hours: { broker: 24 },
          fx_policy: "single_currency_only",
          metrics: { volatility: "not_enabled", concentration: "not_enabled", liquidity: "not_enabled", drawdown: "not_enabled" },
          reason_codes: ["NO_VALUATION_SNAPSHOTS", "RISK_METRICS_NOT_ENABLED"],
        }
      : {
          schema_version: FINANCE_SCHEMA_VERSION,
          service: "book-finance-api",
          source_of_truth: "sqlite.finance_control_plane",
          items: [],
          limit: 12,
          offset: 0,
          next_cursor: null,
        };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json", "X-Request-ID": "partial-request" },
    });
  };

  try {
    const dashboard = await loadFinanceDashboard("2026-08");
    assert.equal(dashboard.ok, true);
    if (!dashboard.ok) return;
    assert.equal(dashboard.endpointStatuses.valuations.status, "error");
    assert.match(dashboard.endpointStatuses.valuations.error || "", /โหลดข้อมูล/);
    assert.deepEqual(dashboard.valuations, []);
    assert.equal(dashboard.endpointStatuses.investments.status, "ok");

    valuationFailure = "cursor";
    const malformedCursorDashboard = await loadFinanceDashboard("2026-08");
    assert.equal(malformedCursorDashboard.ok, true);
    if (malformedCursorDashboard.ok) {
      assert.equal(malformedCursorDashboard.endpointStatuses.valuations.status, "error");
      assert.match(malformedCursorDashboard.endpointStatuses.valuations.error || "", /ข้อมูลหน้าไม่ครบ/);
      assert.deepEqual(malformedCursorDashboard.valuations, []);
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.FINANCE_API_TOKEN;
    else process.env.FINANCE_API_TOKEN = originalToken;
    if (originalBaseUrl === undefined) delete process.env.FINANCE_API_BASE_URL;
    else process.env.FINANCE_API_BASE_URL = originalBaseUrl;
  }
});
