"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Icon } from "@/components/Icon";
import { ROADMAP, STATUS_META } from "@/data/roadmap";

// ตาราง checklist เต็มจอ (แยกจากตัวแอป — ไม่จำกัดความกว้างมือถือ)
// สถานะติ๊กเก็บใน Supabase (roadmap_state) แชร์ทั้งทีม · โครงรายการ: src/data/roadmap.ts
export default function Roadmap() {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);

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
  const isDone = (id: string, defaultStatus: string) => overrides[id] ?? defaultStatus === "done";
  const doneCount = allItems.filter((i) => isDone(i.id, i.status)).length;
  const total = allItems.length;
  const pct = Math.round((doneCount / total) * 100);

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* แถบบน */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-ink-900">จีนรู้ใจ</span>
            <span className="font-[family-name:var(--font-sc)] text-sm text-seal">中文知心</span>
            <span className="ml-2 hidden text-sm text-slate-400 sm:inline">· ตารางเช็กลิสต์พัฒนาระบบ</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-400 sm:inline">ติ๊กแล้วบันทึกออนไลน์ — ทีมเห็นเหมือนกัน</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-ink-900"
            >
              เปิดแอป <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {saveError && (
          <div className="mb-4 rounded-xl bg-seal-soft p-3 text-sm text-seal">
            บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง (ตรวจอินเทอร์เน็ต)
          </div>
        )}

        {/* สรุปรวม */}
        <section className="mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-ink-900 via-ink-700 to-ink-500 p-6 text-white shadow-lg sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="text-sm text-ink-100">ความคืบหน้ารวมทั้งระบบ</div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-4xl font-extrabold">
              {loading ? "…" : doneCount}
              <span className="text-xl font-normal text-ink-100"> / {total} ฟังก์ชัน ({loading ? "-" : pct}%)</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="h-3 w-full rounded-full bg-white/20">
              <div className="h-3 rounded-full bg-white transition-all" style={{ width: `${loading ? 0 : pct}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-100">
              {Object.entries(STATUS_META)
                .filter(([k]) => k !== "done")
                .map(([k, v]) => (
                  <span key={k}>
                    {v.label}: {allItems.filter((i) => i.status === k && !isDone(i.id, i.status)).length}
                  </span>
                ))}
            </div>
          </div>
        </section>

        {/* ตารางเช็กลิสต์ */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="w-16 px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3">ฟังก์ชัน</th>
                <th className="w-32 px-4 py-3">กำหนดการ</th>
              </tr>
            </thead>
            {ROADMAP.map((m) => {
              const mDone = m.items.filter((i) => isDone(i.id, i.status)).length;
              return (
                <tbody key={m.id}>
                  {/* แถวหัวโมดูล */}
                  <tr className="border-y border-slate-200 bg-ink-50/60">
                    <td colSpan={3} className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Icon name={m.icon} className="h-5 w-5 text-ink-700" />
                        <span className="font-semibold text-ink-900">{m.title}</span>
                        <span className="text-xs text-slate-400">— {m.desc}</span>
                        <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 font-[family-name:var(--font-display)] text-xs font-bold text-slate-500 shadow-sm">
                          {mDone}/{m.items.length}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* แถวฟังก์ชัน */}
                  {m.items.map((it) => {
                    const done = isDone(it.id, it.status);
                    const meta = STATUS_META[it.status];
                    return (
                      <tr
                        key={it.id}
                        onClick={() => !loading && toggle(it.id, it.status)}
                        className="cursor-pointer border-b border-slate-100 transition last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-2.5 text-center align-middle">
                          <span
                            className={`inline-grid h-6 w-6 place-items-center rounded-md border-2 align-middle transition ${
                              done ? "border-correct bg-correct text-white" : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            <Icon name="check" className="h-4 w-4" strokeWidth={3} />
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 leading-snug ${done ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700"}`}>
                          {it.label}
                        </td>
                        <td className="px-4 py-2.5">
                          {it.status !== "done" ? (
                            <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}>
                              {meta.label}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">
          คลิกแถวเพื่อติ๊ก/เลิกติ๊ก · สถานะเก็บใน Supabase แชร์ทั้งทีม · โครงรายการแก้ใน{" "}
          <code className="rounded bg-slate-100 px-1">src/data/roadmap.ts</code>
          <br />⚠️ ยังไม่ล็อกสิทธิ์การติ๊ก — จะจำกัดเฉพาะ Admin เมื่อระบบสมาชิกเสร็จ (ส.ค.)
        </p>
      </main>
    </div>
  );
}
