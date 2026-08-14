import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Noto_Sans_SC, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

// ฟอนต์ 3 ตัว 3 หน้าที่ (ต้องรองรับ ไทย + จีน + พินอิน พร้อมกันทุกหน้า)
//   thai    = เนื้อความไทย/ละติน (พินอินใช้ตัวนี้ — มีเครื่องหมายวรรณยุกต์ ā á ǎ à ครบ)
//   sc      = ตัวอักษรจีน (ต้องเด่นสุดบนจอเสมอ)
//   display = หัวข้อ/ตัวเลขใหญ่ — โทนสงบ น่าเชื่อถือ ไม่เป็นการ์ตูน (เดิมใช้ Mali ซึ่งลายมือเกินไปสำหรับ 星航)
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

const display = Noto_Sans_Thai({
  variable: "--font-display",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "星航 Xīng Háng — เรียนจีนจาก 0 สู่ HSK",
  description:
    "เดินทางเรียนภาษาจีนตั้งแต่ปูพื้นฐานถึง HSK 1–2 สำหรับคนไทย — เรียนคำศัพท์ ฝึกฟัง-อ่าน และทวนตามจังหวะที่จำได้ดีที่สุด",
};

export const viewport: Viewport = {
  themeColor: "#0d2440", // midnight navy — แถบเบราว์เซอร์บนมือถือจะเป็นสีท้องฟ้ากลางคืน
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${thai.variable} ${sc.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full font-[family-name:var(--font-thai)] text-slate-800">
        {children}
      </body>
    </html>
  );
}
