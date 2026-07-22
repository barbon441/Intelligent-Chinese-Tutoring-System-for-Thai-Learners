"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Icon } from "@/components/Icon";
import { ROADMAP, STATUS_META } from "@/data/roadmap";

// ตาราง checklist กดติ๊กได้จริง — สถานะติ๊กเก็บใน Supabase (roadmap_state) แชร์กันทั้งทีม
// โครงรายการอยู่ใน src/data/roadmap.ts · สถานะตั้งต้น = status "done" ในโค้ด, การติ๊กทับค่าได้
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
      setOverrides((o) => ({ ...o, [id]: !next })); // ย้อนกลับถ้าบันทึกไม่ได้
      setSaveError(true);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-700">
          แผนพัฒนาระบบ (Roadmap)
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          แตะช่องเพื่อติ๊ก — บันทึกออนไลน์ ทีมเห็นเหมือนกันทุกเครื่อง
        </p>
      </header>

      {saveError && (
        <div className="rounded-xl bg-seal-soft p-3 text-sm text-seal">
          บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง (ตรวจอินเทอร์เน็ต)
        </div>
      )}

      {/* สรุปรวม */}
      <section className="rounded-3xl bg-gradient-to-br from-ink-900 via-ink-700 to-ink-500 p-5 text-white shadow-lg">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-100">ความคืบหน้ารวม</span>
          <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
            {loading ? "…" : doneCount}
            <span className="text-lg font-normal text-ink-100"> / {total}</span>
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full rounded-full bg-white/20">
          <div className="h-2.5 rounded-full bg-white transition-all" style={{ width: `${loading ? 0 : pct}%` }} />
        </div>
        <div className="mt-2 text-right text-xs text-ink-100">{loading ? "กำลังโหลดสถานะ..." : `${pct}%`}</div>
      </section>

      {/* ตารางรายโมดูล */}
      {ROADMAP.map((m) => {
        const mDone = m.items.filter((i) => isDone(i.id, i.status)).length;
        return (
          <section key={m.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {/* หัวโมดูล */}
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-50 text-ink-700">
                <Icon name={m.icon} className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-700">{m.title}</div>
                <div className="text-[11px] text-slate-400">{m.desc}</div>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 font-[family-name:var(--font-display)] text-xs font-bold text-slate-500 shadow-sm">
                {mDone}/{m.items.length}
              </span>
            </div>
            {/* แถวติ๊ก */}
            <ul>
              {m.items.map((it) => {
                const done = isDone(it.id, it.status);
                const meta = STATUS_META[it.status];
                return (
                  <li key={it.id} className="border-b border-slate-50 last:border-0">
                    <button
                      onClick={() => toggle(it.id, it.status)}
                      disabled={loading}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 active:bg-ink-50 disabled:opacity-60"
                    >
                      <span
                        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition ${
                          done
                            ? "border-correct bg-correct text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <Icon name="check" className="h-4 w-4" strokeWidth={3} />
                      </span>
                      <span className={`flex-1 text-sm leading-snug ${done ? "text-slate-400 line-through decoration-slate-300" : "text-slate-600"}`}>
                        {it.label}
                      </span>
                      {it.status !== "done" && (
                        <span className={`mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${meta.cls}`}>
                          {meta.label}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <p className="pb-2 text-center text-[11px] leading-relaxed text-slate-300">
        สถานะติ๊กเก็บใน Supabase (แชร์ทั้งทีม) · โครงรายการแก้ใน src/data/roadmap.ts
        <br />
        ⚠️ ตอนนี้ใครเปิดหน้านี้ก็ติ๊กได้ — จะล็อกเฉพาะ Admin เมื่อระบบสมาชิกเสร็จ (ส.ค.)
      </p>
    </div>
  );
}
