import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Noto_Sans_SC, Mali } from "next/font/google";
import "./globals.css";

const thai = IBM_Plex_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const sc = Noto_Sans_SC({
  variable: "--font-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// ฟอนต์ display ปลายมน (หัวข้อ/ตัวเลข) — รองรับไทย+ละติน
const display = Mali({
  variable: "--font-display",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "จีนรู้ใจ 中文知心 — ติวเตอร์ HSK สำหรับคนไทย",
  description: "ติวเตอร์เตรียมสอบ HSK 1–2 อัจฉริยะสำหรับคนไทย",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${thai.variable} ${sc.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 font-[family-name:var(--font-thai)] text-slate-800">
        {children}
      </body>
    </html>
  );
}
