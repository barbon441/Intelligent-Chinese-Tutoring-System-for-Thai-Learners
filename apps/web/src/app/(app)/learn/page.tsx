"use client";

// หน้าเลือกหมวดเรียน (m1-3) — ประตูหลักของฝั่ง "เรียน"
// การ์ดโมดูล 0 (เริ่มที่นี่ — กำลังสร้าง) + การ์ด 5 หมวด (โครงหฤทัยอนุมัติ 26 ก.ค.)
// กฎที่ใช้: PA-02 ไม่ล็อกลำดับหมวด เลือกเสรี ระบบแค่แนะนำ · ความคืบหน้า = คำที่เริ่มเรียนแล้ว (มีการ์ด FSRS) / คำทั้งหมดในหมวด

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Icon } from "@/components/Icon";
import { CATEGORIES } from "@/data/categories";
import { loadCards } from "@/lib/fsrs";

type Row = { id: number; category: number | null };

export default function Learn() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState<Set<number>>(new Set());

  useEffect(() => {
    setStarted(new Set(Object.keys(loadCards()).map(Number)));
    (async () => {
      const { data, error } = await supabase
        .from("words")
        .select("id, category")
        .eq("hsk_level", 1);
      if (error) setError(error.message);
      else setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  const byCat = useMemo(() => {
    const m = new Map<number, { total: number; learned: number }>();
    for (const c of CATEGORIES) m.set(c.id, { total: 0, learned: 0 });
    for (const r of rows) {
      if (!r.category) continue;
      const b = m.get(r.category);
      if (!b) continue;
      b.total += 1;
      if (started.has(r.id)) b.learned += 1;
    }
    return m;
  }, [rows, started]);

  // หมวดแนะนำ = หมวดแรก (ง่ายสุด) ที่ยังเรียนไม่ครบ — กฎ PA-09 (แนะนำ ไม่บังคับ)
  const suggestedId = useMemo(() => {
    for (const c of CATEGORIES) {
      const b = byCat.get(c.id);
      if (b && b.learned < b.total) return c.id;
    }
    return null;
  }, [byCat]);

  if (loading) return <Center>กำลังโหลดหมวดเรียน...</Center>;
  if (error) return <Center>❌ {error}</Center>;

  return (
    <div className="flex flex-col gap-4 p-5">
      <header>
        <h1 className="text-xl font-semibold text-slate-700">เลือกหมวดเรียน</h1>
        <p className="mt-1 text-sm text-slate-400">
          300 คำ HSK 1 แบ่ง 5 หมวด เรียงง่าย → ยาก · เลือกเรียนหมวดไหนก่อนก็ได้
        </p>
      </header>

      {/* ด่านพื้นฐานเสียง (ศัพท์ทีม: โมดูล 0) — กำลังสร้าง */}
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 p-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-ink-500">
          <Icon name="speaker" className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 font-medium text-ink-700">
            ปูพื้นฐานเสียงก่อนเริ่ม
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-500">เริ่มที่นี่ถ้าไม่มีพื้น</span>
          </div>
          <div className="mt-0.5 text-xs text-slate-400">พินอินเทียบเสียงไทย · วรรณยุกต์ · เกมฝึกหู — กำลังสร้าง (ส.ค.)</div>
        </div>
      </div>

      {/* การ์ด 5 หมวด */}
      {CATEGORIES.map((c) => {
        const b = byCat.get(c.id) ?? { total: 0, learned: 0 };
        const pct = b.total ? Math.round((b.learned / b.total) * 100) : 0;
        const suggested = c.id === suggestedId;
        return (
          <div key={c.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-700">
                <Icon name={c.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-700">
                    หมวด {c.id} · {c.name}
                  </span>
                  {suggested && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-streak/10 px-1.5 py-0.5 text-[10px] font-bold text-streak">
                      <Icon name="flame" className="h-3 w-3" /> แนะนำ
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">{c.desc}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-correct transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {b.learned}/{b.total} คำ
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/flashcards?cat=${c.id}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-900 active:scale-95"
              >
                <Icon name="cards" className="h-4 w-4" /> บัตรคำ
              </Link>
              <Link
                href={`/practice?cat=${c.id}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 active:scale-95"
              >
                <Icon name="pencil" className="h-4 w-4" /> ฝึก
              </Link>
            </div>
          </div>
        );
      })}

      <p className="mt-1 text-center text-xs leading-relaxed text-slate-400">
        ควิซท้ายหมวด + % จากคะแนนควิซ กำลังตามมา (ส.ค.) · ความคืบหน้าตอนนี้นับจากคำที่เริ่มเรียนในระบบทวน
      </p>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[60vh] items-center justify-center text-slate-600">{children}</div>;
}
