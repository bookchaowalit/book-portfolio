---
title: BookPortfolio — Product Card
doc_id: CARD-book-portfolio
doc_type: product-card
verdict: showcase
version: 0.1
date: 2026-10-08
status: ร่างเพื่อพิจารณา
owner: Product owner (Book Dev)
---

# BookPortfolio — Product Card

## 1. สรุปคุณค่าในหนึ่งประโยค

หน้า dashboard อ่านอย่างเดียวที่ช่วยเจ้าของเห็นภาพรวมการเงิน การลงทุน สภาพคล่อง และภาระที่จะครบกำหนด จาก BookFinance API v1

## 2. ปัญหาและผู้ใช้เป้าหมาย

- ข้อมูลการเงินส่วนตัวกระจายหลายบัญชี ต้องการภาพรวมเดียวที่ไม่แตะข้อมูลดิบ
- ผู้ใช้: เจ้าของคนเดียว (wealth dashboard ส่วนตัว)

## 3. สิ่งที่ทำได้จริงตอนนี้

- Next.js server component เรียก 8 endpoint ของ `/api/finance/v1/*` (summary, transactions, accounts, investments, reconciliations, valuations, risk-readiness, invoices) ด้วย token ฝั่ง server เท่านั้น
- ตาม `next_cursor` จนโหลด investment/valuation ครบ ไม่ตัดยอดที่ 12 แถว
- คำนวณสัญญาณสภาพคล่องและภาระแบบอ่านอย่างเดียว; ไม่อ่าน SQLite/CSV และไม่เขียนข้อมูล
- test 2 ไฟล์ (contract, page)

## 4. หลักฐานสถานะ

- Stack: Next.js, React
- Commits: 9 (แรก 2026-09-09 → ล่าสุด 2026-10-01), branch `main`; working tree สะอาด
- Source: 9 ไฟล์ / 2,426 บรรทัด; test 2 ไฟล์
- CI: 1 workflow
- Deploy config: ไม่มี
- Live URL: ไม่พบใน repo
- API ต้นทางอยู่ที่ `infra/api/finance.ts` ใน Solo Empire

## 5. คุณค่าและจุดต่าง

- แยกขอบเขตความปลอดภัยชัด (token ไม่หลุดไป browser, อ่านอย่างเดียว)
- แอปการเงินส่วนตัวในตลาดมีฟีเจอร์มากกว่า; คุณค่าอยู่ที่การเชื่อมกับระบบของเจ้าของเอง ไม่มีมุมรายได้

## 6. ช่องว่างสำคัญ

- ไม่มี deploy config; ใช้ได้เฉพาะเมื่อ Finance API รันอยู่
- ยังไม่ยืนยันว่าเจ้าของใช้หน้าจอนี้แทน dashboard อื่นของ Solo Empire **[ต้องยืนยัน]**

## 7. คำตัดสิน

**showcase** — ทำงานจริงและออกแบบขอบเขตดี แต่เป็นเครื่องมือส่วนตัวที่ไม่ใช่ธุรกิจ และอาจซ้อนกับ `infra/dashboard/web`

จะเปลี่ยนเป็น `merge` (canonical: `infra/dashboard/web`) ถ้า dashboard หลักแสดงข้อมูลเดียวกันอยู่แล้ว; เป็น `invest` ถ้ากลายเป็นหน้าจอการเงินหลักที่ใช้ทุกสัปดาห์

## 8. ขั้นต่อไป

1. เทียบกับหน้าการเงินใน `infra/dashboard/web` แล้วเลือกตัวหลัก
2. ถ้าคงไว้ ให้เพิ่ม test ของสัญญาณสภาพคล่อง

## การอนุมัติ

| บทบาท | สถานะ | วันที่ | ลงนาม |
|---|---|---|---|
| Product owner (Book Dev) | รอพิจารณา | — | ________ |

## แหล่งข้อมูล

- `README.md`
- `app/page.tsx`
- `src/lib/finance.ts`
- `tests/`
- `infra/api/finance.ts (Solo Empire root)`
