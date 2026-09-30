import {
  formatDate,
  formatDateTime,
  formatMoney,
  buildFinancePortfolioPositions,
  loadFinanceDashboard,
  resolveReportingPeriod,
  statusLabel,
  summarizeFinancePortfolio,
  summarizeFinanceReconciliations,
  summarizeFinanceSignals,
  summarizeFinanceValuationCoverage,
  transactionLabel,
} from "../src/lib/finance";
import type { FinanceEndpoint } from "../src/lib/finance";

export const dynamic = "force-dynamic";

function monthLabel(period: string): string {
  const parsed = new Date(`${period}-01T00:00:00Z`);
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function firstCurrency<T extends { currency: string }>(rows: T[]): T | null {
  return rows.find((row) => row.currency === "THB") || rows[0] || null;
}

function investmentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    stock: "หุ้น",
    etf: "ETF",
    fund: "กองทุน",
    bond: "พันธบัตร",
    crypto: "คริปโต",
    real_estate: "อสังหาริมทรัพย์",
    business: "ธุรกิจ",
    other: "อื่น ๆ",
  };
  return labels[type] || type;
}

function reconciliationSourceLabel(sourceType: string): string {
  const labels: Record<string, string> = {
    bank_statement: "Bank statement",
    wallet_export: "Wallet export",
    invoice_register: "Invoice register",
    manual: "Manual",
    other: "Other",
  };
  return labels[sourceType] || sourceType;
}

function reconciliationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "เปิดอยู่",
    exception: "ผิดปกติ",
    matched: "ตรงกัน",
    closed: "ปิดแล้ว",
  };
  return labels[status] || status;
}

function riskReasonLabel(code: string): string {
  const labels: Record<string, string> = {
    NO_VALUATION_SNAPSHOTS: "ยังไม่มี valuation snapshot",
    INCOMPLETE_COVERAGE: "coverage ยังไม่ครบ",
    STALE_VALUATION: "ข้อมูล valuation เก่าเกิน policy",
    UNVERIFIED_PRICE_QUALITY: "ราคายังไม่ verified",
    MULTI_CURRENCY_FX_UNAVAILABLE: "หลายสกุลเงิน แต่ยังไม่มี FX contract",
    RISK_METRICS_NOT_ENABLED: "risk metrics ยังไม่เปิดใช้งาน",
  };
  return labels[code] || code;
}

function metricDefinitionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_owner_review: "รอ owner review",
    approved: "อนุมัติแล้ว",
  };
  return labels[status] || status;
}

function fxContractStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    "proposed-pending-owner-review": "FX contract รอ owner review",
    approved: "FX contract อนุมัติแล้ว",
  };
  return labels[status] || status;
}

const financeEndpointLabels: Record<FinanceEndpoint, string> = {
  summary: "สรุปการเงิน",
  transactions: "รายการธุรกรรม",
  accounts: "บัญชี",
  investments: "การลงทุน",
  reconciliations: "การกระทบยอด",
  valuations: "มูลค่าเงินลงทุน",
  riskReadiness: "risk readiness",
  invoices: "ใบแจ้งหนี้",
};

type HomeProps = {
  searchParams: Promise<{ period?: string | string[] }>;
};

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const dashboard = await loadFinanceDashboard(firstQueryValue(params.period));
  const signals = dashboard.ok ? summarizeFinanceSignals(dashboard.summary) : null;
  const portfolioReady = dashboard.ok
    && dashboard.endpointStatuses.investments.status === "ok"
    && dashboard.endpointStatuses.valuations.status === "ok";
  const portfolio = portfolioReady ? summarizeFinancePortfolio(dashboard.investments, dashboard.valuations) : null;
  const portfolioPositions = dashboard.ok && portfolio
    ? buildFinancePortfolioPositions(dashboard.investments, dashboard.valuations, portfolio.currency)
    : [];
  const reconciliationSignals = dashboard.ok ? summarizeFinanceReconciliations(dashboard.reconciliations) : null;
  const valuationCoverage = dashboard.ok ? summarizeFinanceValuationCoverage(dashboard.valuations, portfolio?.currency) : null;
  const riskReadiness = dashboard.ok ? dashboard.riskReadiness : null;
  const failedEndpoints = dashboard.ok
    ? (Object.entries(dashboard.endpointStatuses) as Array<[FinanceEndpoint, { status: string; error?: string }]>).filter(([, status]) => status.status === "error")
    : [];

  return (
    <main id="main" tabIndex={-1} className="shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">BP</span>
          <div>
            <p className="eyebrow">PRIVATE WEALTH DESK</p>
            <p className="brand-name">BookPortfolio</p>
          </div>
        </div>
        <div className={`connection-pill ${dashboard.ok ? "is-online" : "is-offline"}`}>
          <span className="status-dot" aria-hidden="true" />
          {dashboard.ok ? "API CONNECTED" : "API CONFIG NEEDED"}
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow accent">FINANCE CONTROL PLANE / READ MODEL</p>
          <h1>มองภาพการเงินให้ชัด<br /><em>แล้วตัดสินใจให้ดีขึ้น</em></h1>
          <p className="hero-copy">
            Wealth view แบบ read-only สำหรับเงินสด รายรับ รายจ่าย และภาระผูกพัน
            โดยข้อมูลทั้งหมดผ่าน BookFinance API v1
          </p>
        </div>
        <div className="period-card">
          <span>REPORTING PERIOD</span>
          <strong>{monthLabel(dashboard.period)}</strong>
          <small>{dashboard.ok ? "Live from Finance Control Plane" : "รอเชื่อมต่อ API"}</small>
          <form className="period-form" method="get">
            <label htmlFor="period">เลือกช่วงเวลา</label>
            <div className="period-form-row">
              <input id="period" name="period" type="month" defaultValue={resolveReportingPeriod(dashboard.period)} />
              <button type="submit">ดู</button>
            </div>
          </form>
        </div>
      </section>

      {!dashboard.ok ? (
        <section className="setup-card" aria-live="polite">
          <div className="setup-icon" aria-hidden="true">↗</div>
          <div>
            <p className="eyebrow accent">LOCAL SETUP</p>
            <h2>Frontend พร้อมแล้ว แต่ยังไม่ได้เชื่อม Finance API</h2>
            <p>{dashboard.error}</p>
            <code>cp .env.example .env.local</code>
            <p className="muted">ตั้งค่า <strong>FINANCE_API_TOKEN</strong> เป็น scoped token ที่มี `finance:read` แล้วเปิด API ที่ `FINANCE_API_BASE_URL`</p>
          </div>
        </section>
      ) : (
        <>
          {failedEndpoints.length ? (
            <section className="setup-card" aria-live="polite">
              <div className="setup-icon" aria-hidden="true">!</div>
              <div>
                <p className="eyebrow accent">PARTIAL DATA</p>
                <h2>Finance โหลดได้บางส่วน</h2>
                <p>ข้อมูลของส่วนที่ล้มเหลวจะไม่ถูกตีความเป็นยอดศูนย์หรือไม่มีรายการ</p>
                <ul>
                  {failedEndpoints.map(([endpoint, status]) => (
                    <li key={endpoint}>{financeEndpointLabels[endpoint]}: {status.error || "โหลดข้อมูลไม่สำเร็จ"}</li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          <section className="metric-grid" aria-label="Finance summary">
            {(() => {
              const primary = firstCurrency(dashboard.summary.transactions);
              const currency = primary?.currency || "THB";
              return (
                <>
                  <article className="metric-card metric-card-dark">
                    <span>รายรับในเดือนนี้</span>
                    <strong>{formatMoney(primary?.income || 0, currency)}</strong>
                    <small>{primary?.count || 0} รายการ · {currency}</small>
                  </article>
                  <article className="metric-card">
                    <span>รายจ่ายในเดือนนี้</span>
                    <strong>{formatMoney(primary?.expense || 0, currency)}</strong>
                    <small>จาก Finance Control Plane</small>
                  </article>
                  <article className="metric-card metric-card-warm">
                    <span>กระแสสุทธิ</span>
                    <strong>{formatMoney(primary?.net || 0, currency)}</strong>
                    <small>{(primary?.net ?? 0) >= 0 ? "เงินไหลเข้าสุทธิ" : "ควรทบทวนรายจ่าย"}</small>
                  </article>
                  <article className="metric-card">
                    <span>บัญชีที่ใช้งาน</span>
                    <strong>{dashboard.summary.accounts.active}</strong>
                    <small>active accounts</small>
                  </article>
                </>
              );
            })()}
          </section>

          {signals ? (
            <section className="control-grid" aria-label="Liquidity and obligations">
              <article className="panel control-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow accent">LIQUIDITY & OBLIGATIONS</p><h2>เงินรับและภาระผูกพัน</h2></div>
                  <span className="panel-caption">{signals.currency} · read-only</span>
                </div>
                <div className="signal-grid">
                  <div className="signal-card">
                    <span>รับแล้ว</span>
                    <strong>{formatMoney(signals.revenueReceived, signals.currency)}</strong>
                    <small>revenue received</small>
                  </div>
                  <div className="signal-card signal-card-warm">
                    <span>ค้างรับ</span>
                    <strong>{formatMoney(signals.revenuePending, signals.currency)}</strong>
                    <small>revenue pending</small>
                  </div>
                  <div className="signal-card signal-card-alert">
                    <span>ภาระผูกพัน</span>
                    <strong>{formatMoney(signals.liabilityOutstanding, signals.currency)}</strong>
                    <small>{signals.liabilityCount} รายการคงค้าง</small>
                  </div>
                  <div className="signal-card">
                    <span>ใบแจ้งหนี้เปิด</span>
                    <strong>{formatMoney(signals.openInvoiceAmount, signals.currency)}</strong>
                    <small>{signals.openInvoiceCount} รายการในช่วงที่เลือก</small>
                  </div>
                </div>
                <p className="control-footnote">เป็น signal จาก read model ของ `finance.v1` ไม่ใช่ยอด cash balance ที่ผ่านการกระทบยอดแล้ว</p>
              </article>

              <article className="panel control-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow accent">CONTROL CHECKS</p><h2>สิ่งที่ควรติดตาม</h2></div>
                </div>
                <div className="watch-list">
                  <div className={`watch-row ${signals.revenuePending > 0 ? "is-warn" : "is-ok"}`}>
                    <span className="watch-indicator" />
                    <div><strong>รายรับค้างรับ</strong><small>{signals.revenuePending > 0 ? "มีรายการที่ยังไม่ได้รับเงิน" : "ไม่พบยอดค้างรับ"}</small></div>
                  </div>
                  <div className={`watch-row ${signals.liabilityOutstanding > 0 ? "is-warn" : "is-ok"}`}>
                    <span className="watch-indicator" />
                    <div><strong>ภาระผูกพัน</strong><small>{signals.liabilityOutstanding > 0 ? "มีรายการที่ต้องติดตาม" : "ไม่พบภาระคงค้าง"}</small></div>
                  </div>
                  <div className={`watch-row ${signals.openInvoiceCount > 0 ? "is-warn" : "is-ok"}`}>
                    <span className="watch-indicator" />
                    <div><strong>ใบแจ้งหนี้เปิด</strong><small>{signals.openInvoiceCount > 0 ? "มี invoice ที่ยังไม่ปิดสถานะ" : "ไม่มี invoice เปิด"}</small></div>
                  </div>
                </div>
              </article>
            </section>
          ) : null}

          {portfolio ? (
            <section className="portfolio-grid" aria-label="Portfolio valuation snapshot">
              <article className="panel portfolio-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow accent">PORTFOLIO SNAPSHOT</p><h2>มูลค่าพอร์ตที่บันทึกไว้</h2></div>
                  <span className="panel-caption">{portfolio.currency} · valuation snapshot</span>
                </div>
                <div className="portfolio-stat-grid">
                  <div className="portfolio-stat portfolio-stat-dark">
                    <span>มูลค่าปัจจุบัน</span>
                    <strong>{formatMoney(portfolio.currentValue, portfolio.currency)}</strong>
                    <small>{portfolio.pricedPositions}/{portfolio.activePositions} positions มี valuation</small>
                  </div>
                  <div className="portfolio-stat">
                    <span>ต้นทุนสะสม</span>
                    <strong>{formatMoney(portfolio.costBasis, portfolio.currency)}</strong>
                    <small>cost basis ที่มีใน read model</small>
                  </div>
                  <div className="portfolio-stat portfolio-stat-warm">
                    <span>กำไร/ขาดทุนที่คำนวณได้</span>
                    <strong>{portfolio.unrealizedGainLoss === null ? "—" : formatMoney(portfolio.unrealizedGainLoss, portfolio.currency)}</strong>
                    <small>{portfolio.unrealizedGainLoss === null ? "รอข้อมูล valuation ครบ" : "current value − cost basis"}</small>
                  </div>
                </div>
                <div className="holdings-list">
                  {portfolioPositions.length ? portfolioPositions
                    .map((item) => (
                      <div className="holding-row" key={item.investmentId}>
                        <div>
                          <strong>{item.name}</strong>
                          <small>
                            {investmentTypeLabel(item.investmentType)} · จำนวน {item.quantity ?? "—"} · {item.valuationSource === "snapshot"
                              ? `snapshot ${formatDateTime(item.valuationAsOf)}`
                              : item.valuationSource === "investment_read_model" ? "legacy current value" : "ยังไม่มี valuation"}
                          </small>
                        </div>
                        <div className="holding-value"><strong>{item.currentValue === null ? "—" : formatMoney(item.currentValue, item.currency)}</strong><small>ต้นทุน {item.costBasis === null ? "—" : formatMoney(item.costBasis, item.currency)}</small></div>
                      </div>
                    )) : <div className="empty-state">ยังไม่มี investment ที่มี valuation ใน {portfolio.currency}</div>}
                </div>
                <p className="control-footnote">ยอดนี้ใช้ latest `finance_valuation_snapshots` เป็นหลัก; ถ้ายังไม่มี snapshot จะแสดง legacy current value พร้อมป้ายกำกับ และยังไม่ใช่ราคาตลาด realtime หรือ risk score</p>
              </article>

              <article className="panel portfolio-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow accent">KNOWN EXPOSURE</p><h2>สัดส่วนตามประเภท</h2></div>
                  <span className="panel-caption">known value</span>
                </div>
                {portfolio.allocations.length ? (
                  <div className="exposure-list">
                    {portfolio.allocations.map((allocation) => (
                      <div className="exposure-row" key={allocation.investmentType}>
                        <div><strong>{investmentTypeLabel(allocation.investmentType)}</strong><small>{allocation.count} position{allocation.count === 1 ? "" : "s"}</small></div>
                        <strong>{formatMoney(allocation.currentValue, portfolio.currency)}</strong>
                      </div>
                    ))}
                  </div>
                ) : <div className="empty-state">ยังไม่มีข้อมูล exposure</div>}
                {portfolio.unpricedPositions ? <p className="portfolio-warning">มี {portfolio.unpricedPositions} position ที่ยังไม่มี current value จึงไม่ถูกรวมใน known exposure</p> : null}
              </article>
            </section>
          ) : dashboard.ok && !portfolioReady ? (
            <section className="setup-card" aria-live="polite">
              <div className="setup-icon" aria-hidden="true">!</div>
              <div>
                <p className="eyebrow accent">PORTFOLIO UNAVAILABLE</p>
                <h2>ยังคำนวณ Portfolio ไม่ได้</h2>
                <p>ต้องโหลดทั้ง investments และ valuation snapshots ครบก่อน จึงจะแสดงยอดพอร์ตเพื่อไม่ให้ยอดบางส่วนถูกเข้าใจว่าเป็นยอดทั้งหมด</p>
              </div>
            </section>
          ) : null}

          {portfolio && reconciliationSignals && valuationCoverage && riskReadiness ? (
            <section className="risk-grid" aria-label="Risk readiness and reconciliation controls">
              <article className="panel risk-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow accent">RISK READINESS</p><h2>ความพร้อมก่อนทำ risk engine</h2></div>
                  <span className="panel-caption">{riskReadiness.status} · control-only</span>
                </div>
                <div className="risk-stat-grid">
                  <div className="risk-stat risk-stat-dark">
                    <span>ส่วนต่างที่ยังเปิด</span>
                    <strong>{formatMoney(reconciliationSignals.unresolvedDifference, reconciliationSignals.currency, { precise: true })}</strong>
                    <small>{reconciliationSignals.openCount + reconciliationSignals.exceptionCount} รายการ open / exception</small>
                  </div>
                  <div className="risk-stat risk-stat-warm">
                    <span>Exception</span>
                    <strong>{reconciliationSignals.exceptionCount}</strong>
                    <small>รายการที่ต้องตรวจสอบ</small>
                  </div>
                  <div className="risk-stat">
                    <span>Valuation coverage</span>
                    <strong>{valuationCoverage.positionCount ? `${valuationCoverage.coveredPositions}/${valuationCoverage.positionCount}` : "—"}</strong>
                    <small>{valuationCoverage.latestAsOf ? `as of ${formatDateTime(valuationCoverage.latestAsOf)}` : "ยังไม่มี valuation snapshot"}</small>
                  </div>
                  <div className="risk-stat">
                    <span>Matched</span>
                    <strong>{reconciliationSignals.matchedCount}</strong>
                    <small>reconciliation ที่ตรงกัน</small>
                  </div>
                </div>
                <div className={`risk-readiness-banner ${riskReadiness.status === "ready" ? "is-ready" : "is-blocked"}`}>
                  <div>
                    <strong>{riskReadiness.status === "ready" ? "Input พร้อมประเมิน" : "Input ยัง blocked"}</strong>
                    <small>{riskReadiness.eligible_positions}/{riskReadiness.total_positions} eligible · coverage {Math.round(riskReadiness.coverage_ratio * 100)}% · {riskReadiness.currency}</small>
                  </div>
                  <p>{riskReadiness.reason_codes.map(riskReasonLabel).join(" · ")} · metric definitions: {metricDefinitionStatusLabel(riskReadiness.metric_definitions_status)} · {fxContractStatusLabel(riskReadiness.fx_contract_status)}</p>
                </div>
                <p className="control-footnote">ใช้ snapshot ที่มี `valuation_as_of` เท่านั้น; panel นี้ยังไม่คำนวณ risk score และไม่ส่งคำสั่งลงทุน</p>
              </article>

              <article className="panel risk-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow accent">RECONCILIATION QUEUE</p><h2>รายการที่ต้องติดตาม</h2></div>
                  <span className="panel-caption">{reconciliationSignals.currency} · read-only</span>
                </div>
                <div className="reconciliation-list">
                  {dashboard.reconciliations.filter((item) => item.currency === reconciliationSignals.currency).length ? dashboard.reconciliations
                    .filter((item) => item.currency === reconciliationSignals.currency)
                    .map((item) => (
                      <div className="reconciliation-row" key={item.id}>
                        <div>
                          <strong>{reconciliationSourceLabel(item.source_type)}</strong>
                          <small>{formatDate(item.period_start)} – {formatDate(item.period_end)} · {reconciliationStatusLabel(item.status)}</small>
                        </div>
                        <strong className={item.status === "exception" ? "risk-value-alert" : ""}>
                          {item.difference_amount === null ? "—" : formatMoney(item.difference_amount, item.currency, { precise: true })}
                        </strong>
                      </div>
                    )) : <div className="empty-state">ยังไม่มี reconciliation ใน {reconciliationSignals.currency}</div>}
                </div>
              </article>
            </section>
          ) : null}

          <section className="content-grid">
            <article className="panel panel-wide">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow accent">ACTIVITY</p>
                  <h2>รายการล่าสุด</h2>
                </div>
                <span className="panel-caption">{dashboard.transactions.length} รายการ</span>
              </div>
              {dashboard.endpointStatuses.transactions.status === "error" ? (
                <div className="empty-state">โหลดรายการธุรกรรมไม่ได้ จึงยังแสดงรายการนี้ไม่ได้</div>
              ) : dashboard.transactions.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>รายการ</th><th>หมวดหมู่</th><th>วันที่</th><th className="align-right">จำนวนเงิน</th></tr>
                    </thead>
                    <tbody>
                      {dashboard.transactions.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.description || item.merchant || "ไม่ระบุรายการ"}</strong><small>{transactionLabel(item.transaction_type)}</small></td>
                          <td><span className="tag">{item.category || "ทั่วไป"}</span></td>
                          <td>{formatDate(item.transaction_date)}</td>
                          <td className={`align-right amount ${item.transaction_type === "income" ? "amount-positive" : ""}`}>
                            {item.transaction_type === "income" ? "+" : "−"}{formatMoney(Math.abs(item.amount), item.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="empty-state">ยังไม่มีรายการใน read model</div>}
            </article>

            <article className="panel">
              <div className="panel-heading"><div><p className="eyebrow accent">ACCOUNTS</p><h2>บัญชีที่ใช้งาน</h2></div></div>
              <div className="stack-list">
                {dashboard.endpointStatuses.accounts.status === "error" ? (
                  <div className="empty-state">โหลดบัญชีไม่ได้ จึงยังแสดงยอดบัญชีไม่ได้</div>
                ) : dashboard.accounts.length ? dashboard.accounts.map((account) => (
                  <div className="list-row" key={account.id}>
                    <div className="avatar">{account.name.slice(0, 1).toUpperCase()}</div>
                    <div><strong>{account.name}</strong><small>{account.account_type || "บัญชีการเงิน"}</small></div>
                    <span className="row-status">{account.currency}</span>
                  </div>
                )) : <div className="empty-state">ไม่มีบัญชี active</div>}
              </div>
            </article>

            <article className="panel panel-wide">
              <div className="panel-heading">
                <div><p className="eyebrow accent">INVOICES</p><h2>ใบแจ้งหนี้ล่าสุด</h2></div>
                <span className="panel-caption">read-only</span>
              </div>
              {dashboard.endpointStatuses.invoices.status === "error" ? (
                <div className="empty-state">โหลดใบแจ้งหนี้ไม่ได้ จึงยังแสดงรายการนี้ไม่ได้</div>
              ) : dashboard.invoices.length ? (
                <div className="invoice-grid">
                  {dashboard.invoices.map((invoice) => (
                    <div className="invoice-card" key={invoice.id}>
                      <div><span className="invoice-number">{invoice.invoice_no || `INV-${invoice.id}`}</span><span className={`invoice-status status-${invoice.status}`}>{statusLabel(invoice.status)}</span></div>
                      <strong>{formatMoney(invoice.amount, invoice.currency)}</strong>
                      <small>ออกเมื่อ {formatDate(invoice.issue_date)} · ครบกำหนด {formatDate(invoice.due_date)}</small>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-state">ยังไม่มีใบแจ้งหนี้</div>}
            </article>

            <article className="panel side-note">
              <p className="eyebrow accent">DATA BOUNDARY</p>
              <h2>Source of truth เดียว</h2>
              <p>Frontend นี้ไม่แตะ SQLite, CSV, scraper หรือ raw source โดยตรง ทุก request ใช้ schema `finance.v1` และ bearer scope `finance:read`</p>
              <div className="boundary-line"><span className="status-dot is-online" /> <span>Authenticated read model</span></div>
              <div className="boundary-line"><span className="status-dot is-online" /> <span>Redacted API audit trail</span></div>
              <div className="boundary-line"><span className="status-dot is-online" /> <span>Subject rate limit</span></div>
            </article>
          </section>
          <footer className="footer-note">BookPortfolio frontend · {dashboard.requestIds.length} API requests · schema finance.v1 · request IDs retained by the API audit boundary</footer>
        </>
      )}
    </main>
  );
}
