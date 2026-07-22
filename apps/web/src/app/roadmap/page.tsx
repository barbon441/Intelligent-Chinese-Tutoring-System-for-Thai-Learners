import { Icon } from "@/components/Icon";
import { ROADMAP, STATUS_META, type ItemStatus } from "@/data/roadmap";

// หน้าตาราง checklist พัฒนาระบบ — เปิดโชว์อาจารย์ได้ทุกนัด (ข้อมูล: src/data/roadmap.ts)
export default function Roadmap() {
  const all = ROADMAP.flatMap((m) => m.items);
  const count = (s: ItemStatus) => all.filter((i) => i.status === s).length;
  const done = count("done");
  const total = all.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-700">
          แผนพัฒนาระบบ (Roadmap)
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          โมดูล · ฟังก์ชัน · สถานะ — อัปเดตตามความคืบหน้าจริง
        </p>
      </header>

      {/* สรุปรวม */}
      <section className="rounded-3xl bg-gradient-to-br from-ink-900 via-ink-700 to-ink-500 p-5 text-white shadow-lg">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-100">ความคืบหน้ารวม</span>
          <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
            {done}
            <span className="text-lg font-normal text-ink-100"> / {total} ฟังก์ชัน</span>
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full rounded-full bg-white/20">
          <div className="h-2.5 rounded-full bg-white" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-100">
          <span>✓ เสร็จ {done}</span>
          <span>กำลังทำ {count("doing")}</span>
          <span>คิว ส.ค. {count("aug")}</span>
          <span>ก.ย.–ต.ค. {count("sep")}</span>
          <span>HSK2 {count("hsk2")} · opt {count("opt")}</span>
        </div>
      </section>

      {/* การ์ดรายโมดูล */}
      {ROADMAP.map((m) => {
        const mDone = m.items.filter((i) => i.status === "done").length;
        return (
          <section key={m.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-700">
                <Icon name={m.icon} className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-700">{m.title}</div>
                <div className="text-xs text-slate-400">{m.desc}</div>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 font-[family-name:var(--font-display)] text-xs font-bold text-slate-500">
                {mDone}/{m.items.length}
              </span>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {m.items.map((it, i) => {
                const meta = STATUS_META[it.status];
                const isDone = it.status === "done";
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                        isDone ? "border-emerald-200 bg-emerald-50 text-correct" : "border-slate-200 bg-slate-50 text-transparent"
                      }`}
                    >
                      <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} />
                    </span>
                    <span className={`flex-1 text-sm leading-snug ${isDone ? "text-slate-600" : "text-slate-500"}`}>
                      {it.label}
                    </span>
                    <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <p className="pb-2 text-center text-[11px] text-slate-300">
        คู่กับเอกสาร กรอบระบบ-CHECKLIST.md ใน repo · มาตรฐานอ้างอิง: HSK 3.0 (ระดับ 1–2)
      </p>
    </div>
  );
}
