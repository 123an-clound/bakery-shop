import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import "../globals.css";
import { Toaster } from "@/components/ui/sonner";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// mục 6.2: admin routes must never be indexed.
export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s | Quản trị Tiệm Bánh" },
  robots: { index: false, follow: false },
};

/**
 * Own root layout (own `<html>`/`<body>`) — `/admin` is a sibling of
 * `[locale]`, not nested inside it, so it never inherits next-intl or the
 * customer-facing runtime theme (`.admin-theme` in globals.css instead).
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} admin-theme h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
