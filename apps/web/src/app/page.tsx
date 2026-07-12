"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [stats, setStats] = useState<{ total: number; withAudio: number; reviewed: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("words")
        .select("audio_path, th_reviewed")
        .eq("hsk_level", 1);
      if (data) {
        setStats({
          total: data.length,
          withAudio: data.filter((w) => w.audio_path).length,
          reviewed: data.filter((w) => w.th_reviewed).length,
        });
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* การ์ดต้อนรับ */}
      <section className="rounded-3xl bg-gradient-to-br from-sky-600 to-sky-800 p-6 text-white shadow-lg">
        <div className="font-[family-name:var(--font-sc)] text-3xl">你好！</div>
        <h1 className="mt-1 text-xl font-semibold">พร้อมติว HSK 1 กันหรือยัง</h1>
        <p className="mt-1 text-sm text-sky-100">เรียนคำศัพท์ · ฝึกฟัง-อ่าน · วัดความพร้อมสอบ</p>
        <Link
          href="/flashcards"
          className="mt-4 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-sky-800 shadow"
        >
          เริ่มเรียนบัตรคำ →
        </Link>
      </section>

      {/* การ์ดความคืบหน้าคลังคำ */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">คลังคำศัพท์ HSK 1</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="คำศัพท์" value={stats ? `${stats.total}` : "…"} sub="คำ" tone="sky" />
          <Stat label="มีเสียงอ่าน" value={stats ? `${stats.withAudio}` : "…"} sub={`/${stats?.total ?? "…"}`} tone="emerald" />
          <Stat label="ตรวจแล้ว" value={stats ? `${stats.reviewed}` : "…"} sub={`/${stats?.total ?? "…"}`} tone="pink" />
        </div>
      </section>

      {/* โมดูล */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">โมดูลการเรียน</h2>
        <div className="flex flex-col gap-3">
          <ModuleCard href="/flashcards" icon="🃏" title="บัตรคำศัพท์" desc="เรียน 300 คำ HSK 1 พร้อมเสียง" ready />
          <ModuleCard href="/practice" icon="📝" title="ฝึกทำข้อสอบ" desc="ข้อสอบฟัง-อ่านแบบ HSK ตรวจให้ทันที" ready />
          <ModuleCard href="/progress" icon="📊" title="ผลการเรียน" desc="ดูความคืบหน้า + ความแม่นยำ" ready />
          <ModuleCard icon="🔁" title="ทบทวนอัจฉริยะ (FSRS)" desc="ทวนคำตอนกำลังจะลืมพอดี" />
          <ModuleCard icon="🧪" title="ข้อสอบเสมือนจริง" desc="Mock Exam จับเวลา วัดความพร้อมสอบ" />
        </div>
      </section>

      <p className="pb-2 text-center text-[11px] text-slate-300">
        เวอร์ชันพัฒนา · โมดูลที่ยังไม่เปิดจะทยอยเพิ่ม
      </p>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  const tones: Record<string, string> = {
    sky: "text-sky-700", emerald: "text-emerald-600", pink: "text-pink-600",
  };
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center">
      <div className={`text-2xl font-bold ${tones[tone]}`}>{value}</div>
      <div className="text-[11px] text-slate-400">{sub}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function ModuleCard({
  href, icon, title, desc, ready = false,
}: { href?: string; icon: string; title: string; desc: string; ready?: boolean }) {
  const inner = (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
        ready ? "border-slate-100 bg-white hover:border-sky-200 hover:shadow-sm" : "border-slate-100 bg-slate-50 opacity-70"
      }`}
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-2xl">{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-slate-700">{title}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
      <div className="text-sm text-slate-300">{ready ? "→" : "เร็ว ๆ นี้"}</div>
    </div>
  );
  return ready && href ? <Link href={href}>{inner}</Link> : inner;
}
