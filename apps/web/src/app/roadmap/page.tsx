"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Icon } from "@/components/Icon";
import { ROADMAP, STATUS_META, NEXT_UP } from "@/data/roadmap";

// สีชิปทักษะ (field skill ของแต่ละฟังก์ชัน)
const SKILL_CLS: Record<string, string> = {
  "ฟัง": "bg-sky-50 text-sky-600",
  "อ่าน": "bg-emerald-50 text-emerald-600",
  "เขียน": "bg-amber-50 text-amber-700",
  "ฟัง+อ่าน": "bg-violet-50 text-violet-600",
  "เครื่องมือ": "bg-slate-100 text-slate-500",
};

// จับชิปทักษะเข้ากลุ่มหัวข้อ (ฟัง+อ่าน นับรวมกลุ่มฟัง) + ป้ายหัวกลุ่ม
const SKILL_GROUP: Record<string, string> = { "ฟัง": "ฟัง", "ฟัง+อ่าน": "ฟัง", "อ่าน": "อ่าน", "เขียน": "เขียน", "เครื่องมือ": "เครื่องมือ" };
const GROUP_LABEL: Record<string, string> = { "ฟัง": "ทักษะฟัง", "อ่าน": "ทักษะอ่าน", "เขียน": "ทักษะเขียน (แบบฝึกเสริม)", "เครื่องมือ": "เครื่องมือกลาง" };

// เมนู checklist 2 ชั้น: โมดูล (พับ/กาง) → ฟังก์ชัน (ติ๊กได้ · เก็บใน Supabase แชร์ทีม) → งานย่อย (กดดู)
export default function Roadmap() {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set(ROADMAP.filter((m) => m.items.some((i) => i.status === "doing")).map((m) => m.id))
  );
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("roadmap_state").select("item_id, done");
      if (data) {
        const map: Record<string, boolean> = {};
        for (const r of data) map[r.item_id] = r.done;
        setOverrides(map);
      }
      setLoading(false);
    })();
  }, []);

  const allItems = useMemo(() => ROADMAP.flatMap((m) => m.items), []);
  const hsk1Total = ROADMAP.filter((m) => m.id !== "m11").reduce((n, m) => n + m.items.length, 0);
  const hsk2Total = ROADMAP.find((m) => m.id === "m11")?.items.length ?? 0;
  const isDone = (id: string, defaultStatus: string) => overrides[id] ?? defaultStatus === "done";
  const doneCount = allItems.filter((i) => isDone(i.id, i.status)).length;
  const total = allItems.length;
  const pct = Math.round((doneCount / total) * 100);

  // รายการ "ถัดไป" = ตัวแรกในลำดับงาน (NEXT_UP) ที่ยังไม่ถูกติ๊ก — โชว์เป็นป้ายในลิสต์
  const nextId = useMemo(() => {
    const lookup = new Map(allItems.map((i) => [i.id, i]));
    for (const n of NEXT_UP) {
      const it = lookup.get(n.itemId);
      if (it && !isDone(it.id, it.status)) return it.id;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, overrides]);

  async function toggle(id: string, defaultStatus: string) {
    const next = !isDone(id, defaultStatus);
    setOverrides((o) => ({ ...o, [id]: next })); // optimistic
    setSaveError(false);
    const { error } = await supabase
      .from("roadmap_state")
      .upsert({ item_id: id, done: next, updated_at: new Date().toISOString() });
    if (error) {
      setOverrides((o) => ({ ...o, [id]: !next }));
      setSaveError(true);
    }
  }

  const flip = (set: Set<string>, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* แถบบน */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-sc)] text-lg font-bold text-ocean-900">星航</span>
            <span className="ml-2 hidden text-sm text-slate-400 sm:inline">· เมนูฟังก์ชันทั้งหมด + ติ๊กความคืบหน้า</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ocean-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-ocean-900"
          >
            เปิดแอป <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        {saveError && (
          <div className="mb-4 rounded-xl bg-coral-soft p-3 text-sm text-coral">บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง (ตรวจอินเทอร์เน็ต)</div>
        )}

        {/* สรุปรวม */}
        <section className="mb-5 rounded-2xl bg-gradient-to-r from-ocean-900 via-ocean-700 to-ocean-500 p-5 text-white shadow-lg">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ocean-100">ความคืบหน้ารวมทั้งระบบ</span>
            <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
              {loading ? "…" : doneCount}
              <span className="text-lg font-normal text-ocean-100"> / {total} ({loading ? "-" : pct}%)</span>
            </span>
          </div>
          <div className="mt-3 h-2.5 w-full rounded-full bg-white/20">
            <div className="h-2.5 rounded-full bg-white transition-all" style={{ width: `${loading ? 0 : pct}%` }} />
          </div>
        </section>

        {/* เมนูโมดูล (พับ/กาง) */}
        <div className="flex flex-col gap-3">
          {ROADMAP.map((m) => {
            const mDone = m.items.filter((i) => isDone(i.id, i.status)).length;
            const open = openModules.has(m.id);
            return (
              <Fragment key={m.id}>
              {m.id === "m0" && (
                <div className="flex items-baseline gap-2 rounded-xl bg-ocean-700 px-4 py-2.5 text-white">
                  <span className="font-[family-name:var(--font-display)] text-sm font-bold">เฟสปัจจุบัน · HSK 1</span>
                  <span className="text-xs text-ocean-100">ทุกฟังก์ชันข้างล่างนี้ = พาสอบ HSK 1 ผ่าน ({hsk1Total} ฟังก์ชัน)</span>
                </div>
              )}
              {m.id === "m11" && (
                <div className="mt-2 flex items-baseline gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-100 px-4 py-2.5">
                  <span className="font-[family-name:var(--font-display)] text-sm font-bold text-slate-600">เฟสถัดไป · HSK 2</span>
                  <span className="text-xs text-slate-500">ส่วนที่เพิ่มจาก HSK 1 ({hsk2Total} รายการ — ของใหม่จริง 2 ตัว ที่เหลือใช้ระบบเดิม แค่เนื้อหายากขึ้น)</span>
                </div>
              )}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* หัวโมดูล — กดเพื่อเปิด/ปิด */}
                <button
                  onClick={() => setOpenModules((s) => flip(s, m.id))}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ocean-50 text-ocean-700">
                    <Icon name={m.icon} className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-700">{m.title}</div>
                    <div className="text-xs text-slate-400">{m.desc}</div>
                  </div>
                  {/* แถบความคืบหน้าเล็กของโมดูล */}
                  <div className="hidden w-24 sm:block">
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-correct transition-all" style={{ width: `${(mDone / m.items.length) * 100}%` }} />
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 font-[family-name:var(--font-display)] text-xs font-bold text-slate-500">
                    {mDone}/{m.items.length}
                  </span>
                  <Icon name="arrowRight" className={`h-4 w-4 shrink-0 text-slate-300 transition-transform ${open ? "rotate-90" : ""}`} />
                </button>

                {/* เส้นทางข้างใน (จุดเข้า → ด่าน → เงื่อนไข → จุดออก) */}
                {open && (
                  <div className="border-t border-slate-100 px-4 py-4">
                    {/* จุดเข้า */}
                    {m.entry && (
                      <div className="mb-1 flex items-start gap-3">
                        <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center">
                          <Icon name="play" className="h-4 w-4 text-ocean-300" />
                        </span>
                        <span className="rounded-lg bg-ocean-50 px-3 py-1.5 text-xs text-ocean-700">{m.entry}</span>
                      </div>
                    )}
                    <ul>
                      {m.items.map((it, idx) => {
                        const done = isDone(it.id, it.status);
                        const meta = STATUS_META[it.status];
                        const showDetails = openItems.has(it.id);
                        const isLast = idx === m.items.length - 1;
                        const grp = it.skill ? SKILL_GROUP[it.skill] : undefined;
                        const prevSkill = idx > 0 ? m.items[idx - 1].skill : undefined;
                        const prevGrp = prevSkill ? SKILL_GROUP[prevSkill] : undefined;
                        const nextSkill = idx + 1 < m.items.length ? m.items[idx + 1].skill : undefined;
                        const nextGrp = nextSkill ? SKILL_GROUP[nextSkill] : undefined;
                        return (
                          <Fragment key={it.id}>
                          {grp && grp !== prevGrp && (
                            <li className="flex items-center gap-2 pb-1 pl-9 pt-3">
                              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${SKILL_CLS[grp] ?? "bg-slate-100 text-slate-500"}`}>{GROUP_LABEL[grp]}</span>
                              <span className="h-px flex-1 bg-slate-100" />
                            </li>
                          )}
                          <li className="relative pl-9">
                            {/* เส้นเชื่อมแนวตั้ง */}
                            {(!isLast || m.exit) && <span className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-slate-200" />}
                            {m.entry && idx === 0 && <span className="absolute left-[11px] -top-1 h-3 w-0.5 bg-slate-200" />}
                            {/* จุดติ๊กบนเส้น */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!loading) toggle(it.id, it.status);
                              }}
                              aria-label="ติ๊กว่าทำแล้ว"
                              className={`absolute left-0 top-2 grid h-6 w-6 place-items-center rounded-full border-2 transition active:scale-90 ${
                                done ? "border-correct bg-correct text-white" : "border-slate-300 bg-white text-transparent hover:border-correct/60"
                              }`}
                            >
                              <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                            </button>
                            {/* เนื้อหาขั้น */}
                            <div
                              onClick={() => it.details?.length && setOpenItems((s) => flip(s, it.id))}
                              className={`flex items-start gap-2 rounded-lg px-2 py-2 transition hover:bg-slate-50 ${it.details?.length ? "cursor-pointer" : ""}`}
                            >
                              <div className="flex-1">
                                <span className="mr-1.5 inline-block rounded bg-slate-100 px-1 align-middle font-mono text-[10px] text-slate-400">
                                  {it.id}
                                </span>
                                {it.skill && (
                                  <span className={`mr-1.5 inline-block rounded px-1 align-middle text-[10px] font-medium ${SKILL_CLS[it.skill] ?? "bg-slate-100 text-slate-500"}`}>
                                    {it.skill}
                                  </span>
                                )}
                                <span className={`text-sm leading-snug ${done ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700"}`}>
                                  {it.label}
                                </span>
                                {it.id === nextId && (
                                  <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-streak/10 px-1.5 py-0.5 align-middle text-[10px] font-bold text-streak">
                                    <Icon name="flame" className="h-3 w-3" /> ทำต่อไป
                                  </span>
                                )}
                                {showDetails && it.details && (
                                  <ul className="mt-2 flex flex-col gap-1 rounded-lg bg-slate-50 p-3">
                                    {it.details.map((d, i) => (
                                      <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ocean-300" />
                                        {d}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              {it.status !== "done" && (
                                <span className={`mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${meta.cls}`}>{meta.label}</span>
                              )}
                              {it.details?.length ? (
                                <Icon
                                  name="arrowRight"
                                  className={`mt-1 h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform ${showDetails ? "rotate-90" : ""}`}
                                />
                              ) : null}
                            </div>
                            {/* เงื่อนไขผ่านหลังขั้นนี้ */}
                            {it.gateAfter && (
                              <div className="mb-1 ml-2 flex items-center gap-2 py-1">
                                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                                  ⤋ {it.gateAfter}
                                </span>
                              </div>
                            )}
                          </li>
                          {grp && grp !== nextGrp && m.hsk2ByGroup?.[grp] && (
                            <li className="pb-2 pl-9">
                              <span className="inline-flex items-baseline gap-1.5 rounded-md border border-dashed border-violet-200 bg-violet-50/60 px-2 py-1">
                                <span className="rounded bg-violet-100 px-1 text-[10px] font-bold text-violet-600">เฟส HSK 2</span>
                                <span className="text-[11px] leading-snug text-violet-700/80">{m.hsk2ByGroup[grp]}</span>
                              </span>
                            </li>
                          )}
                          </Fragment>
                        );
                      })}
                    </ul>
                    {/* โน้ต: เฟส HSK2 จะเพิ่มอะไรในกล่องนี้ */}
                    {m.hsk2 && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg border border-dashed border-violet-200 bg-violet-50/60 px-3 py-2">
                        <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600">เฟส HSK 2</span>
                        <span className="text-xs leading-relaxed text-violet-700/80">{m.hsk2}</span>
                      </div>
                    )}
                    {/* จุดออก */}
                    {m.exit && (
                      <div className="mt-1 flex items-start gap-3 pl-0">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center">
                          <Icon name="arrowRight" className="h-4 w-4 rotate-90 text-correct" />
                        </span>
                        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-correct">{m.exit}</span>
                      </div>
                    )}
                  </div>
                )}
              </section>
              </Fragment>
            );
          })}
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
          กดหัวโมดูลเพื่อกาง · กดชื่อฟังก์ชันเพื่อดูงานย่อย · กดช่องสี่เหลี่ยมเพื่อติ๊ก (บันทึกออนไลน์ ทีมเห็นเหมือนกัน)
          <br />⚠️ ยังไม่ล็อกสิทธิ์การติ๊ก — จะจำกัดเฉพาะ Admin เมื่อระบบสมาชิกเสร็จ (ส.ค.)
        </p>
      </main>
    </div>
  );
}
