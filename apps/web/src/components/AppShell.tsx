"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { LEVELS } from "@/data/levels";

// ระดับที่กำลังเดินทางอยู่ = ระดับสุดท้ายที่มีเนื้อหาจริงแล้ว — เปิด HSK 2 เมื่อไหร่ ป้ายนี้ขยับเอง
const CURRENT_LEVEL = LEVELS.filter((l) => l.available).at(-1) ?? LEVELS[0];

// เมนูล่าง 4 ช่อง — ตั้งชื่อตามสิ่งที่ผู้เรียนอยากทำ ไม่ใช่ชื่อฟีเจอร์
// (หน้าฝึก/ผล ไม่มีช่องของตัวเอง แต่เข้าถึงได้จากหน้าแรก · เมนูหมวด · หน้าฉัน)
const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "วันนี้", icon: "home" },
  { href: "/journey", label: "เส้นทาง", icon: "compass" },
  { href: "/flashcards", label: "บัตรคำ", icon: "cards" },
  { href: "/profile", label: "ฉัน", icon: "user" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl shadow-ocean-900/5">
      {/* Header แบรนด์ 星航 */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ocean-100 bg-white/90 px-4 py-2.5 backdrop-blur">
        <Link href="/" aria-label="星航 — กลับหน้าแรก">
          <Logo markClassName="h-8 w-8" animated />
        </Link>
        {/* ระดับที่กำลังเดินทางอยู่ */}
        <Link
          href="/journey"
          className="inline-flex items-center gap-1 rounded-full border border-ocean-200 bg-ocean-50 px-2.5 py-1 text-xs font-semibold text-ocean-700 transition hover:border-ocean-300 hover:bg-ocean-100"
        >
          <Icon name="star" className="h-3.5 w-3.5 text-star-dark" fill="currentColor" strokeWidth={0} />
          {CURRENT_LEVEL.name}
        </Link>
      </header>

      {/* เนื้อหา */}
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>

      {/* เมนูล่างแบบแอปมือถือ */}
      <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 items-stretch border-t border-ocean-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {NAV.map((item) => {
          const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-1 pb-2 pt-3 text-xs transition ${
                active ? "text-ocean-700" : "text-slate-400 hover:text-ocean-500"
              }`}
            >
              {/* ขีดดาวบอกหน้าที่เปิดอยู่ */}
              <span
                aria-hidden="true"
                className={`absolute top-0 h-1 w-8 rounded-full transition ${active ? "bg-star" : "bg-transparent"}`}
              />
              <Icon name={item.icon} className="h-6 w-6" strokeWidth={active ? 2.1 : 1.75} />
              <span className={active ? "font-semibold" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
