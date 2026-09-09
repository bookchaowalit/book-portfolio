export default function Loading() {
  return (
    <main className="shell loading-shell" aria-busy="true" aria-label="กำลังโหลด Finance Command Center">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">BP</span>
          <div>
            <p className="eyebrow">PRIVATE WEALTH DESK</p>
            <p className="brand-name">BookPortfolio</p>
          </div>
        </div>
        <span className="loading-pill">กำลังเชื่อมต่อ</span>
      </header>
      <section className="loading-hero">
        <div className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-copy" />
      </section>
      <section className="metric-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => <div className="metric-card skeleton-card" key={index} />)}
      </section>
      <section className="content-grid" aria-hidden="true">
        <div className="panel panel-wide skeleton-panel" />
        <div className="panel skeleton-panel" />
      </section>
    </main>
  );
}
