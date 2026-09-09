import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookPortfolio — Wealth view",
  description: "Read-only wealth view powered by the BookFinance API.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
