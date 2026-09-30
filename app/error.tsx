"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" tabIndex={-1} className="shell error-shell">
      <section className="error-state" role="alert">
        <p className="eyebrow accent">FINANCE CONTROL PLANE</p>
        <h1>โหลดหน้า Finance Command Center ไม่สำเร็จ</h1>
        <p>เกิดข้อผิดพลาดระหว่างแสดงผลหน้าเว็บ ข้อมูลการเงินยังคงเป็น read-only และยังไม่มีการเขียนรายการใด ๆ</p>
        <button type="button" onClick={() => reset()}>ลองใหม่</button>
      </section>
    </main>
  );
}
