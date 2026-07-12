"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "หน้าแรก", icon: "🏠", ready: true },
  { href: "/flashcards", label: "บัตรคำ", icon: "🃏", ready: true },
  { href: "/practice", label: "ฝึก", icon: "📝", ready: true },
  { href: "/progress", label: "ผล", icon: "📊", ready: true },
  { href: "/profile", label: "โปรไฟล์", icon: "👤", ready: true },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-sm">
      {/* Header แบรนด์ */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-sky-800">จีนรู้ใจ</span>
          <span className="font-[family-name:var(--font-sc)] text-base text-pink-500">中文知心</span>
        </Link>
        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">HSK 1</span>
      </header>

      {/* เนื้อหา */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* เมนูล่างแบบแอปมือถือ */}
      <nav className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-md -translate-x-1/2 items-stretch border-t border-slate-100 bg-white">
        {NAV.map((item) => {
          const active = path === item.href;
          return (
            <Link
              key={item.href}
              href={item.ready ? item.href : "#"}
              onClick={(e) => !item.ready && e.preventDefault()}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition ${
                active ? "text-pink-600" : item.ready ? "text-slate-500" : "text-slate-300"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {!item.ready && <span className="text-[9px] text-slate-300">เร็ว ๆ นี้</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
