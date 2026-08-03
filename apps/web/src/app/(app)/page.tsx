"use client";

// หน้าแรก — ออกแบบตามหลัก "ข้อมูลของฉันก่อน แล้วพาไปเรียนต่อ" (บอลสั่งรื้อ 2 ส.ค.)
// โครง: ① hero + ปุ่มเรียนต่อปุ่มเดียว (กฎ MO-01 ฉบับแรก) ② การเรียนของฉัน ③ เลือกหมวดเรียน ④ เมนูฝึก/สอบ
// ภาษาบนจอ = ภาษาคนเท่านั้น (กฎ PA-13)

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { buildQueue, loadCards } from "@/lib/fsrs";
import { loadRounds, summarize } from "@/lib/progress";
import { Icon } from "@/components/Icon";
import { CATEGORIES } from "@/data/categories";

type Row = { id: number; category: number | null };

export default function Home() {
  const [rows, setRows] = useState<Row[]>([]);
  const [dueReal, setDueReal] = useState<number | null>(null);
  const [started, setStarted] = useState<Set<number>>(new Set());
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStarted(new Set(Object.keys(loadCards()).map(Number)));
    setStreak(summarize(loadRounds()).streakDays);
    (async () => {
      const { data } = await supabase.from("words").select("id, category").eq("hsk_level", 1);
      if (data) {
        setRows(data as Row[]);
        const { due } = buildQueue(data.map((w) => w.id));
        setDueReal(due.length);
      }
    })();
  }, []);

  const total = rows.length;
  const learned = useMemo(() => rows.filter((r) => started.has(r.id)).length, [rows, started]);

  const byCat = useMemo(() => {
    const m = new Map<number, { total: number; learned: number }>();
    for (const c of CATEGORIES) m.set(c.id, { total: 0, learned: 0 });
    for (const r of rows) {
      const b = r.category ? m.get(r.category) : undefined;
      if (!b) continue;
      b.total += 1;
      if (started.has(r.id)) b.learned += 1;
    }
    return m;
  }, [rows, started]);

  // หมวดที่ควรไปต่อ = หมวดแรกที่ยังเรียนไม่ครบ (กฎ PA-09 — แนะนำ ไม่บังคับ)
  const nextCat = useMemo(() => {
    for (const c of CATEGORIES) {
      const b = byCat.get(c.id);
      if (b && b.total > 0 && b.learned < b.total) return c;
    }
    return null;
  }, [byCat]);

  // ปุ่ม "เรียนต่อ" ปุ่มเดียว (กฎ MO-01): "ทวน" เฉพาะคำที่เคยเรียนแล้วถึงกำหนดจริง — คำใหม่ไม่ใช่ของค้างทวน
  const cta = useMemo(() => {
    if (dueReal === null) return null; // กำลังโหลด
    if (learned === 0 && nextCat)
      return { href: `/learn/category?cat=${nextCat.id}`, label: `เริ่มเรียน · หมวด ${nextCat.id} ${nextCat.name}`, sub: "หมวดแรกง่ายสุด — เริ่มจากคำทักทายที่ได้ใช้จริง" };
    if (dueReal > 0) return { href: "/review", label: `ทวนวันนี้ · ${dueReal} คำ`, sub: "ทวนก่อนแล้วค่อยเรียนคำใหม่ จำแม่นสุด" };
    if (nextCat) return { href: `/learn/category?cat=${nextCat.id}`, label: `เรียนต่อ · หมวด ${nextCat.id} ${nextCat.name}`, sub: "ไม่มีคำค้างทวนแล้ว ลุยคำใหม่ได้เลย" };
    return { href: "/practice", label: "ฝึกทำข้อสอบ", sub: "เรียนครบทุกหมวดแล้ว — ฝึกให้คล่องมือ" };
  }, [dueReal, learned, nextCat]);

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* ① Hero: ทักทาย + ปุ่มเรียนต่อปุ่มเดียว */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-700 to-ink-500 p-6 text-white shadow-lg">
        <span className="pointer-events-none absolute -bottom-8 -right-2 select-none font-[family-name:var(--font-sc)] text-[9rem] leading-none text-white/10">
          知
        </span>
        <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-md border border-white/60 bg-seal font-[family-name:var(--font-sc)] text-sm font-bold shadow">
          心
        </span>
        <div className="relative">
          <div className="font-[family-name:var(--font-sc)] text-3xl">你好！</div>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">
            {streak > 1 ? `เรียนต่อเนื่องมา ${streak} วันแล้ว เก่งมาก` : "วันนี้เรียนอะไรดี"}
          </h1>
          <p className="mt-1 text-sm text-ink-100">
            {total ? `เรียนไปแล้ว ${learned}/${total} คำ` : "เรียนคำศัพท์ · ฝึกฟัง-อ่าน · วัดความพร้อมสอบ"}
            {dueReal !== null && dueReal > 0 ? ` · มี ${dueReal} คำรอทวนวันนี้` : ""}
          </p>
          {cta ? (
            <Link
              href={cta.href}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-semibold text-ink-900 shadow transition active:scale-[0.98]"
            >
              <Icon name="play" className="h-5 w-5 text-seal" />
              {cta.label}
            </Link>
          ) : (
            <div className="mt-4 flex w-full items-center justify-center rounded-xl bg-white/40 px-5 py-3.5 font-semibold text-white/70">
              กำลังโหลด...
            </div>
          )}
          {cta?.sub && <p className="mt-2 text-center text-xs text-ink-100/90">{cta.sub}</p>}
        </div>
      </section>

      {/* ② การเรียนของฉัน — ข้อมูลของผู้เรียน ไม่ใช่ของระบบ */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">การเรียนของฉัน</h2>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">คำที่เรียนแล้ว</span>
            <span className="font-[family-name:var(--font-display)] font-bold text-ink-700">
              {learned}<span className="font-normal text-slate-400">/{total || "…"} คำ</span>
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-ink-500 to-ink-700 transition-all"
              style={{ width: total ? `${(learned / total) * 100}%` : "0%" }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-slate-50 p-2.5">
              <div className="font-[family-name:var(--font-display)] text-xl font-extrabold text-seal">{dueReal ?? "…"}</div>
              <div className="text-xs text-slate-500">คำรอทวนวันนี้</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <div className="font-[family-name:var(--font-display)] text-xl font-extrabold text-streak">{streak}</div>
              <div className="text-xs text-slate-500">วันติดต่อกัน</div>
            </div>
          </div>
        </div>
      </section>

      {/* ③ เลือกหมวดเรียน — ทางเข้าหลักของการเรียน */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">เลือกหมวดเรียน</h2>
        {/* ด่านพื้นฐานเสียง (ศัพท์ทีม: โมดูล 0) — กำลังสร้าง */}
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 p-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-ink-500">
            <Icon name="speaker" className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-500">
              ปูพื้นฐานเสียง (สำหรับคนไม่มีพื้น)
              <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">เร็ว ๆ นี้</span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">พินอินเทียบไทย · วรรณยุกต์ · เกมฝึกหู — กำลังสร้าง ระหว่างนี้เริ่มหมวด 1 ได้เลย</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {CATEGORIES.map((c, i) => {
            const b = byCat.get(c.id) ?? { total: 0, learned: 0 };
            const pct = b.total ? Math.round((b.learned / b.total) * 100) : 0;
            const suggested = nextCat?.id === c.id;
            return (
              <Link
                key={c.id}
                href={`/learn/category?cat=${c.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 ${i > 0 ? "border-t border-slate-50" : ""}`}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-50 text-ink-700">
                  <Icon name={c.icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="truncate font-medium text-slate-700">{c.name}</span>
                    {suggested && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-streak/10 px-1 py-0.5 text-[9px] font-bold text-streak">
                        <Icon name="flame" className="h-2.5 w-2.5" /> ต่อจากเดิม
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-slate-100">
                      <div className="h-1 rounded-full bg-correct" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400">{b.learned}/{b.total}</span>
                  </div>
                </div>
                <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ④ ฝึกและวัดผล */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">ฝึกและวัดผล</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/practice"
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm transition hover:border-ink-300"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink-50 text-ink-700">
              <Icon name="pencil" className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium text-slate-700">ฝึกทำข้อสอบ</div>
            <div className="text-[11px] leading-snug text-slate-400">ฟัง-อ่าน-เรียงประโยค ตรวจทันที</div>
          </Link>
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center opacity-70">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-400">
              <Icon name="flask" className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium text-slate-500">ข้อสอบเสมือนจริง</div>
            <div className="text-[11px] leading-snug text-slate-400">จับเวลาเหมือนสนามสอบ · เร็ว ๆ นี้</div>
          </div>
        </div>
      </section>

      <p className="pb-2 text-center text-[11px] text-slate-300">เวอร์ชันพัฒนา · ฟีเจอร์ใหม่จะทยอยเปิดเพิ่ม</p>
    </div>
  );
}
