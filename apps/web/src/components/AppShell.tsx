"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";

const NAV: { href: string; label: string; icon: IconName; ready: boolean }[] = [
  { href: "/", label: "หน้าแรก", icon: "home", ready: true },
  { href: "/learn", label: "เรียน", icon: "book", ready: true },
  { href: "/flashcards", label: "บัตรคำ", icon: "cards", ready: true },
  { href: "/practice", label: "ฝึก", icon: "pencil", ready: true },
  { href: "/progress", label: "ผล", icon: "chart", ready: true },
  { href: "/profile", label: "โปรไฟล์", icon: "user", ready: true },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-sm">
      {/* Header แบรนด์ */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-[family-name:var(--font-sc)] text-xl font-bold text-seal">中文知心</span>
        </Link>
        {/* badge สไตล์ตราชาด */}
        <span className="rounded-md border border-seal/40 bg-seal-soft px-2.5 py-1 text-xs font-semibold text-seal">
          HSK 1
        </span>
      </header>

      {/* เนื้อหา */}
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>

      {/* เมนูล่างแบบแอปมือถือ */}
      <nav className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-md -translate-x-1/2 items-stretch border-t border-slate-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {NAV.map((item) => {
          const active = path === item.href;
          return (
            <Link
              key={item.href}
              href={item.ready ? item.href : "#"}
              onClick={(e) => !item.ready && e.preventDefault()}
              className={`relative flex flex-1 flex-col items-center gap-1 pb-2 pt-3 text-xs transition ${
                active ? "text-seal" : item.ready ? "text-slate-400 hover:text-slate-600" : "text-slate-300"
              }`}
            >
              {/* ขีดบอกหน้าที่เปิดอยู่ */}
              <span
                className={`absolute top-0 h-1 w-7 rounded-full transition ${active ? "bg-seal" : "bg-transparent"}`}
              />
              <Icon name={item.icon} className="h-6 w-6" strokeWidth={active ? 2.1 : 1.75} />
              <span className={active ? "font-semibold" : ""}>{item.label}</span>
              {!item.ready && <span className="text-[9px] text-slate-300">เร็ว ๆ นี้</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
