export const FINANCE_SCHEMA_VERSION = "finance.v1";

export type FinanceTransactionSummary = {
  currency: string;
  count: number;
  income: number;
  expense: number;
  net: number;
};

export type FinanceRevenueSummary = {
  currency: string;
  count: number;
  total: number;
  received: number;
  pending: number;
};

export type FinanceInvoiceSummary = {
  status: string;
  currency: string;
  count: number;
  amount: number;
};

export type FinanceLiabilitySummary = {
  currency: string;
  count: number;
  outstanding: number;
};

export type FinanceSummary = {
  schema_version: string;
  service: string;
  period: string | null;
  source_of_truth: string;
  transactions: FinanceTransactionSummary[];
  revenue: FinanceRevenueSummary[];
  invoices: FinanceInvoiceSummary[];
  accounts: { active: number };
  liabilities: FinanceLiabilitySummary[];
};

export type FinanceControlSignals = {
  currency: string;
  revenueReceived: number;
  revenuePending: number;
  liabilityOutstanding: number;
  liabilityCount: number;
  openInvoiceAmount: number;
  openInvoiceCount: number;
};

export type FinancePortfolioSnapshot = {
  currency: string;
  activePositions: number;
  pricedPositions: number;
  unpricedPositions: number;
  costBasis: number;
  currentValue: number;
  unrealizedGainLoss: number | null;
  allocations: Array<{ investmentType: string; count: number; currentValue: number }>;
};

export type FinancePortfolioPosition = {
  investmentId: number;
  name: string;
  investmentType: string;
  quantity: number | null;
  costBasis: number | null;
  currentValue: number | null;
  currency: string;
  valuationAsOf: string | null;
  valuationSource: "snapshot" | "investment_read_model" | "unpriced";
};

export type FinanceReconciliation = {
  id: number;
  account_id: number | null;
  period_start: string;
  period_end: string;
  source_type: string;
  expected_amount: number | null;
  reconciled_amount: number | null;
  difference_amount: number | null;
  currency: string;
  status: string;
  reconciled_at: string | null;
};

export type FinanceReconciliationSignals = {
  currency: string;
  openCount: number;
  exceptionCount: number;
  matchedCount: number;
  unresolvedDifference: number;
};

export type FinanceValuation = {
  id: number;
  investment_id: number;
  investment_name: string;
  market_price_snapshot_id: number | null;
  quantity: number | null;
  market_value: number | null;
  currency: string;
  valuation_as_of: string;
  valuation_method: string;
  coverage_status: string;
  market_price: number | null;
  market_price_currency: string | null;
  market_price_as_of: string | null;
  market_price_source_type: string | null;
  market_price_quality: string | null;
};

export type FinanceValuationCoverage = {
  currency: string;
  positionCount: number;
  coveredPositions: number;
  verifiedPositions: number;
  stalePositions: number;
  unpricedPositions: number;
  latestAsOf: string | null;
};

export type FinanceRiskReadiness = {
  schema_version: string;
  service: string;
  source_of_truth: string;
  contract_version: string;
  policy_version: string;
  metric_definitions_version: string;
  metric_definitions_status: string;
  fx_contract_version: string;
  fx_contract_status: string;
  status: "blocked" | "ready";
  risk_engine_enabled: boolean;
  evaluation_as_of: string;
  currency: string;
  total_positions: number;
  eligible_positions: number;
  coverage_ratio: number;
  stale_positions: number;
  unverified_positions: number;
  missing_positions: number;
  latest_valuation_as_of: string | null;
  freshness_max_age_hours: Record<string, number>;
  fx_policy: string;
  metrics: Record<string, string>;
  reason_codes: string[];
};

export type FinanceTransaction = {
  id: number;
  source: string | null;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string | null;
  category: string | null;
  merchant: string | null;
  transaction_date: string;
  account: string | null;
  account_id: number | null;
  subscription_id: number | null;
  created_at: string | null;
};

export type FinanceAccount = {
  id: number;
  name: string;
  account_type: string | null;
  owner_scope: string | null;
  currency: string;
  status: string;
  opening_balance: number;
  opened_on: string | null;
  closed_on: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type FinanceInvoice = {
  id: number;
  invoice_no: string | null;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  status: string;
  description: string | null;
  revenue_id: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type FinanceInvestment = {
  id: number;
  name: string;
  investment_type: string;
  owner_scope: string;
  account_id: number | null;
  quantity: number | null;
  cost_basis: number | null;
  current_value: number | null;
  currency: string;
  acquired_on: string | null;
  status: string;
};

type PagedFinanceResponse<T> = {
  schema_version: string;
  service: string;
  source_of_truth: string;
  items: T[];
  limit: number;
  offset: number;
  next_cursor: string | null;
};

export type FinanceEndpoint =
  | "summary"
  | "transactions"
  | "accounts"
  | "investments"
  | "reconciliations"
  | "valuations"
  | "riskReadiness"
  | "invoices";

export type FinanceEndpointStatus = {
  status: "ok" | "error";
  error?: string;
};

export type FinanceEndpointStatusMap = Record<FinanceEndpoint, FinanceEndpointStatus>;

type ApiResult<T> = {
  data: T;
  requestIds: string[];
};

export type FinanceDashboard =
  | {
      ok: true;
      period: string;
      summary: FinanceSummary;
      transactions: FinanceTransaction[];
      accounts: FinanceAccount[];
      investments: FinanceInvestment[];
      reconciliations: FinanceReconciliation[];
      valuations: FinanceValuation[];
      riskReadiness: FinanceRiskReadiness | null;
      invoices: FinanceInvoice[];
      requestIds: string[];
      endpointStatuses: FinanceEndpointStatusMap;
    }
  | {
      ok: false;
      period: string;
      error: string;
      endpointStatuses: FinanceEndpointStatusMap;
    };

export function isReportingPeriod(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function configuredPeriod(): string {
  const configured = process.env.FINANCE_DASHBOARD_PERIOD?.trim();
  if (configured && isReportingPeriod(configured)) return configured;
  return new Date().toISOString().slice(0, 7);
}

export function resolveReportingPeriod(value?: string): string {
  const requested = value?.trim();
  return requested && isReportingPeriod(requested) ? requested : configuredPeriod();
}

function apiBaseUrl(): string {
  return (process.env.FINANCE_API_BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
}

async function fetchFinanceEndpoint<T>(path: string): Promise<ApiResult<T>> {
  const token = process.env.FINANCE_API_TOKEN?.trim();
  if (!token) throw new Error("FINANCE_API_TOKEN is not configured");

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(3500),
  });

  if (!response.ok) throw new Error(`BookFinance API returned HTTP ${response.status}`);
  const payload = (await response.json()) as T & { schema_version?: string };
  if (payload.schema_version !== FINANCE_SCHEMA_VERSION) {
    throw new Error("BookFinance API returned an unsupported schema");
  }

  const requestId = response.headers.get("X-Request-ID");
  return { data: payload as T, requestIds: requestId ? [requestId] : [] };
}

const FINANCE_PORTFOLIO_PAGE_SIZE = 12;
const MAX_FINANCE_PAGES = 100;

function pagedPath(path: string, limit: number, offset: number): string {
  const separator = path.includes("?") ? "&" : "?";
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return `${path}${separator}${query.toString()}`;
}

async function fetchAllFinancePages<T>(path: string, limit: number): Promise<ApiResult<T[]>> {
  const items: T[] = [];
  const requestIds: string[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_FINANCE_PAGES; page += 1) {
    const result = await fetchFinanceEndpoint<PagedFinanceResponse<T>>(pagedPath(path, limit, offset));
    const response = result.data;
    requestIds.push(...result.requestIds);

    if (!Array.isArray(response.items) || !(response.next_cursor === null || typeof response.next_cursor === "string")) {
      throw new Error("Finance API returned invalid pagination metadata");
    }

    items.push(...response.items);
    if (response.next_cursor === null) return { data: items, requestIds };

    const nextOffset = Number(response.next_cursor);
    if (!Number.isInteger(nextOffset) || nextOffset <= offset || response.items.length === 0) {
      throw new Error("Finance API returned a non-progressing pagination cursor");
    }
    offset = nextOffset;
  }

  throw new Error("Finance API pagination exceeded the safety limit");
}

function endpointStatus<T>(result: PromiseSettledResult<ApiResult<T>>): FinanceEndpointStatus {
  if (result.status === "fulfilled") return { status: "ok" };
  return { status: "error", error: dashboardErrorMessage(result.reason) };
}

function fulfilledData<T>(result: PromiseSettledResult<ApiResult<T>>): T | null {
  return result.status === "fulfilled" ? result.value.data : null;
}

export async function loadFinanceDashboard(requestedPeriod?: string): Promise<FinanceDashboard> {
  const period = resolveReportingPeriod(requestedPeriod);

  const [summaryResult, transactionsResult, accountsResult, investmentsResult, reconciliationsResult, valuationsResult, riskReadinessResult, invoicesResult] = await Promise.allSettled([
    fetchFinanceEndpoint<FinanceSummary>(`/api/finance/v1/summary?period=${period}`),
    fetchFinanceEndpoint<PagedFinanceResponse<FinanceTransaction>>("/api/finance/v1/transactions?limit=8"),
    fetchFinanceEndpoint<PagedFinanceResponse<FinanceAccount>>("/api/finance/v1/accounts?status=active&limit=8"),
    fetchAllFinancePages<FinanceInvestment>("/api/finance/v1/investments?status=active", FINANCE_PORTFOLIO_PAGE_SIZE),
    fetchFinanceEndpoint<PagedFinanceResponse<FinanceReconciliation>>("/api/finance/v1/reconciliations?limit=8"),
    fetchAllFinancePages<FinanceValuation>("/api/finance/v1/valuations?status=active&latest=true", FINANCE_PORTFOLIO_PAGE_SIZE),
    fetchFinanceEndpoint<FinanceRiskReadiness>("/api/finance/v1/risk-readiness"),
    fetchFinanceEndpoint<PagedFinanceResponse<FinanceInvoice>>("/api/finance/v1/invoices?limit=6"),
  ]);

  const endpointStatuses: FinanceEndpointStatusMap = {
    summary: endpointStatus(summaryResult),
    transactions: endpointStatus(transactionsResult),
    accounts: endpointStatus(accountsResult),
    investments: endpointStatus(investmentsResult),
    reconciliations: endpointStatus(reconciliationsResult),
    valuations: endpointStatus(valuationsResult),
    riskReadiness: endpointStatus(riskReadinessResult),
    invoices: endpointStatus(invoicesResult),
  };

  if (summaryResult.status === "rejected") {
    return {
      ok: false,
      period,
      error: dashboardErrorMessage(summaryResult.reason),
      endpointStatuses,
    };
  }

  const results = [summaryResult, transactionsResult, accountsResult, investmentsResult, reconciliationsResult, valuationsResult, riskReadinessResult, invoicesResult];
  return {
    ok: true,
    period,
    summary: summaryResult.value.data,
    transactions: fulfilledData(transactionsResult)?.items ?? [],
    accounts: fulfilledData(accountsResult)?.items ?? [],
    investments: fulfilledData(investmentsResult) ?? [],
    reconciliations: fulfilledData(reconciliationsResult)?.items ?? [],
    valuations: fulfilledData(valuationsResult) ?? [],
    riskReadiness: fulfilledData(riskReadinessResult),
    invoices: fulfilledData(invoicesResult)?.items ?? [],
    requestIds: results.flatMap((result) => result.status === "fulfilled" ? result.value.requestIds : []),
    endpointStatuses,
  };
}

function dashboardErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === "FINANCE_API_TOKEN is not configured") {
    return "ยังไม่ได้ตั้งค่า FINANCE_API_TOKEN สำหรับการอ่านข้อมูลแบบ server-side";
  }
  if (error instanceof Error && error.message.includes("unsupported schema")) {
    return "Finance API ส่ง schema ที่ frontend เวอร์ชันนี้ยังไม่รองรับ";
  }
  if (error instanceof Error && error.message.includes("pagination")) {
    return "Finance API ส่งข้อมูลหน้าไม่ครบหรือ cursor ผิดรูปแบบ";
  }
  if (error instanceof Error && error.message.includes("HTTP")) {
    return "Finance API ตอบกลับผิดปกติชั่วคราว กรุณาตรวจสอบ API และลองใหม่";
  }
  return "ยังไม่สามารถโหลดข้อมูลจาก Finance API ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่";
}

export function formatMoney(value: number, currency: string): string {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: currency || "THB",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || "THB"} ${amount.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`;
  }
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(parsed);
}

const CLOSED_INVOICE_STATUSES = new Set(["paid", "cancelled"]);

function preferredCurrency(rows: Array<{ currency: string }>): string {
  return rows.find((row) => row.currency === "THB")?.currency || rows[0]?.currency || "THB";
}

export function summarizeFinanceSignals(summary: FinanceSummary): FinanceControlSignals {
  const currency = preferredCurrency([
    ...summary.transactions,
    ...summary.revenue,
    ...summary.invoices,
    ...summary.liabilities,
  ]);
  const revenue = summary.revenue.find((row) => row.currency === currency);
  const liabilities = summary.liabilities.find((row) => row.currency === currency);
  const openInvoices = summary.invoices.filter(
    (row) => row.currency === currency && !CLOSED_INVOICE_STATUSES.has(row.status.toLowerCase()),
  );

  return {
    currency,
    revenueReceived: Number(revenue?.received) || 0,
    revenuePending: Number(revenue?.pending) || 0,
    liabilityOutstanding: Number(liabilities?.outstanding) || 0,
    liabilityCount: Number(liabilities?.count) || 0,
    openInvoiceAmount: openInvoices.reduce((total, row) => total + (Number(row.amount) || 0), 0),
    openInvoiceCount: openInvoices.reduce((total, row) => total + (Number(row.count) || 0), 0),
  };
}

function latestValuationsByInvestment(valuations: FinanceValuation[]): Map<string, FinanceValuation> {
  const latest = new Map<string, FinanceValuation>();
  for (const valuation of valuations) {
    const key = `${valuation.investment_id}:${valuation.currency}`;
    const previous = latest.get(key);
    if (
      !previous ||
      valuation.valuation_as_of > previous.valuation_as_of ||
      (valuation.valuation_as_of === previous.valuation_as_of && valuation.id > previous.id)
    ) {
      latest.set(key, valuation);
    }
  }
  return latest;
}

export function buildFinancePortfolioPositions(
  investments: FinanceInvestment[],
  valuations: FinanceValuation[] = [],
  currencyOverride?: string,
): FinancePortfolioPosition[] {
  const active = investments.filter((item) => item.status === "active");
  const currency = currencyOverride || preferredCurrency(active);
  const selected = active.filter((item) => item.currency === currency);
  const latest = latestValuationsByInvestment(valuations);

  return selected.map((item) => {
    const valuation = latest.get(`${item.id}:${item.currency}`);
    const hasSnapshot = Boolean(valuation);
    return {
      investmentId: item.id,
      name: item.name,
      investmentType: item.investment_type,
      quantity: item.quantity,
      costBasis: item.cost_basis,
      currentValue: hasSnapshot ? valuation!.market_value : item.current_value,
      currency: item.currency,
      valuationAsOf: hasSnapshot ? valuation!.valuation_as_of : null,
      valuationSource: hasSnapshot
        ? "snapshot"
        : item.current_value !== null
          ? "investment_read_model"
          : "unpriced",
    };
  });
}

export function summarizeFinancePortfolio(
  investments: FinanceInvestment[],
  valuations: FinanceValuation[] = [],
): FinancePortfolioSnapshot {
  const active = investments.filter((item) => item.status === "active");
  const currency = preferredCurrency(active);
  const positions = buildFinancePortfolioPositions(investments, valuations, currency);
  const priced = positions.filter((item) => item.currentValue !== null);
  const complete = positions.length > 0 && positions.every(
    (item) => item.currentValue !== null && item.costBasis !== null,
  );
  const allocations = new Map<string, { count: number; currentValue: number }>();

  for (const item of positions) {
    const current = allocations.get(item.investmentType) || { count: 0, currentValue: 0 };
    current.count += 1;
    current.currentValue += Number(item.currentValue) || 0;
    allocations.set(item.investmentType, current);
  }

  return {
    currency,
    activePositions: positions.length,
    pricedPositions: priced.length,
    unpricedPositions: positions.length - priced.length,
    costBasis: positions.reduce((total, item) => total + (Number(item.costBasis) || 0), 0),
    currentValue: priced.reduce((total, item) => total + (Number(item.currentValue) || 0), 0),
    unrealizedGainLoss: complete
      ? positions.reduce((total, item) => total + (Number(item.currentValue) || 0) - (Number(item.costBasis) || 0), 0)
      : null,
    allocations: [...allocations.entries()]
      .map(([investmentType, values]) => ({ investmentType, ...values }))
      .sort((left, right) => right.currentValue - left.currentValue),
  };
}

export function summarizeFinanceReconciliations(rows: FinanceReconciliation[]): FinanceReconciliationSignals {
  const currency = preferredCurrency(rows);
  const selected = rows.filter((row) => row.currency === currency);
  const open = selected.filter((row) => row.status.toLowerCase() === "open");
  const exceptions = selected.filter((row) => row.status.toLowerCase() === "exception");

  return {
    currency,
    openCount: open.length,
    exceptionCount: exceptions.length,
    matchedCount: selected.filter((row) => row.status.toLowerCase() === "matched").length,
    unresolvedDifference: [...open, ...exceptions].reduce(
      (total, row) => total + (Number(row.difference_amount) || 0),
      0,
    ),
  };
}

export function summarizeFinanceValuationCoverage(rows: FinanceValuation[], currencyOverride?: string): FinanceValuationCoverage {
  const currency = currencyOverride || preferredCurrency(rows);
  const selected = rows.filter((row) => row.currency === currency);
  const latestByInvestment = new Map<number, FinanceValuation>();

  for (const row of selected) {
    const previous = latestByInvestment.get(row.investment_id);
    if (!previous || row.valuation_as_of > previous.valuation_as_of) latestByInvestment.set(row.investment_id, row);
  }

  const latest = [...latestByInvestment.values()];
  return {
    currency,
    positionCount: latest.length,
    coveredPositions: latest.filter((row) => row.coverage_status === "covered" && row.market_value !== null).length,
    verifiedPositions: latest.filter((row) => row.market_price_quality === "verified").length,
    stalePositions: latest.filter((row) => row.coverage_status === "stale" || row.market_price_quality === "stale").length,
    unpricedPositions: latest.filter((row) => row.coverage_status === "unpriced" || row.market_value === null).length,
    latestAsOf: latest.reduce<string | null>(
      (latestValue, row) => (!latestValue || row.valuation_as_of > latestValue ? row.valuation_as_of : latestValue),
      null,
    ),
  };
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "ใช้งานอยู่",
    paid: "จ่ายแล้ว",
    pending: "รอดำเนินการ",
    overdue: "เกินกำหนด",
    sent: "ส่งแล้ว",
    draft: "ร่าง",
    cancelled: "ยกเลิก",
  };

  return labels[status] || status;
}

export function transactionLabel(type: string): string {
  return type === "income" ? "รายรับ" : type === "expense" ? "รายจ่าย" : type;
}
