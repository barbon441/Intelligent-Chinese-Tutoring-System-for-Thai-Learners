"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { buildQueue } from "@/lib/fsrs";
import { Icon, type IconName } from "@/components/Icon";

export default function Home() {
  const [stats, setStats] = useState<{ total: number; withAudio: number; reviewed: number } | null>(null);
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("words")
        .select("id, audio_path, th_reviewed")
        .eq("hsk_level", 1);
      if (data) {
        setStats({
          total: data.length,
          withAudio: data.filter((w) => w.audio_path).length,
          reviewed: data.filter((w) => w.th_reviewed).length,
        });
        const { due, fresh } = buildQueue(data.map((w) => w.id));
        setDueCount(due.length + fresh.length);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Hero: หมึก + ตราชาด + ลายน้ำอักษร */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-700 to-ink-500 p-6 text-white shadow-lg">
        <span className="pointer-events-none absolute -bottom-8 -right-2 select-none font-[family-name:var(--font-sc)] text-[9rem] leading-none text-white/10">
          知
        </span>
        <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-md border border-white/60 bg-seal font-[family-name:var(--font-sc)] text-sm font-bold shadow">
          心
        </span>
        <div className="relative">
          <div className="font-[family-name:var(--font-sc)] text-3xl">你好！</div>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">พร้อมติว HSK 1 กันหรือยัง</h1>
          <p className="mt-1 text-sm text-ink-100">เรียนคำศัพท์ · ฝึกฟัง-อ่าน · วัดความพร้อมสอบ</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/review"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow"
            >
              <Icon name="refresh" className="h-4 w-4" /> ทวนวันนี้
              {dueCount !== null && (
                <span className="rounded-full bg-seal px-2 py-0.5 text-xs font-bold text-white">{dueCount}</span>
              )}
            </Link>
            <Link
              href="/flashcards"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25"
            >
              เรียนบัตรคำ <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* สถิติคลังคำ */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">คลังคำศัพท์ HSK 1</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat icon="cards" tone="ink" label="คำศัพท์" value={stats ? `${stats.total}` : "…"} sub="คำ" />
          <Stat icon="speaker" tone="correct" label="มีเสียงอ่าน" value={stats ? `${stats.withAudio}` : "…"} sub={`/${stats?.total ?? "…"}`} />
        </div>
      </section>

      {/* โมดูล */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">โมดูลการเรียน</h2>
        <div className="flex flex-col gap-3">
          <ModuleCard href="/flashcards" icon="cards" title="บัตรคำศัพท์" desc="เรียน 300 คำ HSK 1 พร้อมเสียง" ready />
          <ModuleCard href="/practice" icon="pencil" title="ฝึกทำข้อสอบ" desc="ฟัง-อ่าน-เรียงประโยค แบบ HSK ตรวจให้ทันที" ready />
          <ModuleCard href="/progress" icon="chart" title="ผลการเรียน" desc="ดูความคืบหน้า + ความแม่นยำ" ready />
          <ModuleCard href="/review" icon="refresh" title="ทบทวนอัจฉริยะ (FSRS)" desc="ทวนคำตอนกำลังจะลืมพอดี" ready />
          <ModuleCard icon="flask" title="ข้อสอบเสมือนจริง" desc="Mock Exam จับเวลา วัดความพร้อมสอบ" />
        </div>
      </section>

      <p className="pb-2 text-center text-[11px] text-slate-300">เวอร์ชันพัฒนา · โมดูลที่ยังไม่เปิดจะทยอยเพิ่ม</p>
    </div>
  );
}

const TONES: Record<string, { text: string; chip: string }> = {
  ink: { text: "text-ink-700", chip: "bg-ink-50" },
  correct: { text: "text-correct", chip: "bg-emerald-50" },
  seal: { text: "text-seal", chip: "bg-seal-soft" },
};

function Stat({ icon, tone, label, value, sub }: { icon: IconName; tone: string; label: string; value: string; sub: string }) {
  const t = TONES[tone];
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center">
      <div className={`mx-auto mb-1.5 grid h-7 w-7 place-items-center rounded-lg ${t.chip}`}>
        <Icon name={icon} className={`h-4 w-4 ${t.text}`} />
      </div>
      <div className={`font-[family-name:var(--font-display)] text-2xl font-extrabold ${t.text}`}>{value}</div>
      <div className="text-[11px] text-slate-400">{sub}</div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function ModuleCard({
  href,
  icon,
  title,
  desc,
  ready = false,
}: {
  href?: string;
  icon: IconName;
  title: string;
  desc: string;
  ready?: boolean;
}) {
  const inner = (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
        ready ? "border-slate-100 bg-white hover:border-ink-300 hover:shadow-sm" : "border-slate-100 bg-slate-50 opacity-70"
      }`}
    >
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${ready ? "bg-ink-50 text-ink-700" : "bg-slate-100 text-slate-400"}`}>
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-slate-700">{title}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
      {ready ? <Icon name="arrowRight" className="h-4 w-4 text-slate-300" /> : <span className="text-[11px] text-slate-300">เร็ว ๆ นี้</span>}
    </div>
  );
  return ready && href ? <Link href={href}>{inner}</Link> : inner;
}
