// Page-level render tests: the async server component is awaited and its tree
// rendered to static HTML with a stubbed Finance API, so panel states are
// checked without a browser or a running Next.js server.
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import Home from "../app/page";
import { FINANCE_SCHEMA_VERSION } from "../src/lib/finance";

type Routes = Partial<Record<"summary" | "risk" | "transactions" | "accounts" | "investments" | "valuations" | "reconciliations" | "invoices", unknown>>;

const base = { schema_version: FINANCE_SCHEMA_VERSION, service: "book-finance-api", source_of_truth: "sqlite.finance_control_plane" };
const page = (items: unknown[]) => ({ ...base, items, limit: 12, offset: 0, next_cursor: null });
const summary = {
  ...base,
  period: "2026-08",
  transactions: [{ currency: "THB", count: 0, income: 0, expense: 0, net: 0 }],
  revenue: [],
  invoices: [],
  accounts: { active: 0 },
  liabilities: [],
};
const riskReadiness = {
  ...base,
  contract_version: "finance.valuation-risk.v1",
  metric_definitions_status: "pending_owner_review",
  fx_contract_status: "proposed-pending-owner-review",
  status: "blocked",
  currency: "THB",
  total_positions: 0,
  eligible_positions: 0,
  coverage_ratio: 0,
  reason_codes: ["NO_VALUATION_SNAPSHOTS"],
};
const saved = { fetch: globalThis.fetch, token: process.env.FINANCE_API_TOKEN, url: process.env.FINANCE_API_BASE_URL };

function stubApi(routes: Routes = {}): void {
  process.env.FINANCE_API_TOKEN = "test-token";
  process.env.FINANCE_API_BASE_URL = "http://finance.test";
  const bodies: Array<[string, unknown]> = [
    ["/summary?", routes.summary ?? summary],
    ["/risk-readiness", routes.risk ?? riskReadiness],
    ["/transactions?", routes.transactions ?? page([])],
    ["/accounts?", routes.accounts ?? page([])],
    ["/investments?", routes.investments ?? page([])],
    ["/valuations?", routes.valuations ?? page([])],
    ["/reconciliations?", routes.reconciliations ?? page([])],
    ["/invoices?", routes.invoices ?? page([])],
  ];
  globalThis.fetch = async (input) => {
    const url = String(input);
    const match = bodies.find(([fragment]) => url.includes(fragment));
    const body = match ? match[1] : page([]);
    if (body instanceof Response) return body;
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  };
}

async function render(): Promise<string> {
  return renderToStaticMarkup(await Home({ searchParams: Promise.resolve({ period: "2026-08" }) }));
}

beforeEach(() => {
  delete process.env.FINANCE_API_TOKEN;
});

afterEach(() => {
  globalThis.fetch = saved.fetch;
  for (const [key, value] of [["FINANCE_API_TOKEN", saved.token], ["FINANCE_API_BASE_URL", saved.url]] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("without API configuration the page shows the setup state, not zero balances", async () => {
  const html = await render();

  assert.match(html, /API CONFIG NEEDED/);
  assert.match(html, /ยังไม่ได้เชื่อม Finance API/);
  assert.doesNotMatch(html, /API CONNECTED/);
  assert.doesNotMatch(html, /มูลค่าพอร์ตที่บันทึกไว้/);
});

test("a connected but empty read model shows explicit empty states", async () => {
  stubApi();
  const html = await render();

  assert.match(html, /API CONNECTED/);
  assert.doesNotMatch(html, /Finance โหลดได้บางส่วน/);
  for (const empty of ["ยังไม่มีรายการใน read model", "ไม่มีบัญชี active", "ยังไม่มีใบแจ้งหนี้", "ยังไม่มี investment ที่มี valuation"]) {
    assert.ok(html.includes(empty), empty);
  }
});

test("a failed endpoint is reported and never rendered as an empty or zero panel", async () => {
  stubApi({ valuations: new Response("upstream down", { status: 502 }), accounts: new Response("nope", { status: 500 }) });
  const html = await render();

  assert.match(html, /Finance โหลดได้บางส่วน/);
  assert.match(html, /มูลค่าเงินลงทุน/);
  assert.match(html, /บัญชี/);
  assert.match(html, /ยังคำนวณ Portfolio ไม่ได้/);
  assert.doesNotMatch(html, /มูลค่าพอร์ตที่บันทึกไว้/, "a partial portfolio must not be shown as the total");
  assert.match(html, /โหลดบัญชีไม่ได้/);
  assert.doesNotMatch(html, /ไม่มีบัญชี active/, "a failed accounts read must not look like zero accounts");
});

test("holdings without any price are counted as unpriced, not valued at zero", async () => {
  const holding = (id: number, currentValue: number | null) => ({
    id,
    name: `Holding ${id}`,
    investment_type: "fund",
    owner_scope: "personal",
    account_id: 1,
    quantity: 1,
    cost_basis: 100,
    current_value: currentValue,
    currency: "THB",
    acquired_on: "2026-01-01",
    status: "active",
  });
  stubApi({ investments: page([holding(1, 250.5), holding(2, null)]) });
  const html = await render();

  assert.match(html, /มูลค่าพอร์ตที่บันทึกไว้/);
  assert.match(html, /Holding 1/);
  assert.match(html, /มี 1 position ที่ยังไม่มี current value/);
});

test("the page exposes a focusable main landmark for the layout's skip link", async () => {
  const html = await render();

  assert.match(html, /<main id="main" tabindex="-1"/);
});
