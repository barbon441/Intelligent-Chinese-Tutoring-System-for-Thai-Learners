// การ์ดระดับ — ใช้ตัวเดียวกันทั้ง Foundation / HSK 1 / HSK 2 (และ HSK 3–6 ในอนาคต)
// ต่างกันแค่ props: ระดับที่กำลังเดินทางอยู่ = การ์ดท้องฟ้ากลางคืน · ระดับที่ยังไม่เปิด = การ์ดเรียบ

import { Icon, type IconName } from "@/components/Icon";
import { ProgressBar } from "@/components/ProgressBar";
import type { Level } from "@/data/levels";

export function LevelCard({
  level,
  active = false,
  pct,
  caption,
  icon = "star",
  footer,
}: {
  level: Level;
  /** ระดับที่ผู้เรียนกำลังเดินทางอยู่ตอนนี้ */
  active?: boolean;
  /** ความคืบหน้าเป็น % — ไม่ส่ง = ไม่โชว์แถบ (เช่นระดับที่ยังไม่เปิด) */
  pct?: number;
  caption?: string;
  icon?: IconName;
  footer?: React.ReactNode;
}) {
  if (!active) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-slate-400">
            <Icon name={level.available ? icon : "lock"} className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-500">{level.name}</span>
              <span className="font-[family-name:var(--font-sc)] text-sm text-slate-400">{level.zh}</span>
            </div>
            <p className="mt-0.5 text-xs leading-snug text-slate-400">{caption ?? level.desc}</p>
          </div>
          {!level.available && (
            <span className="shrink-0 rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">เร็ว ๆ นี้</span>
          )}
        </div>
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-600 p-5 text-white shadow-lg shadow-ocean-900/20">
      {/* ท้องฟ้ากลางคืน — ดาวจาง ๆ กับตัวจีนใหญ่เป็นพื้นหลัง */}
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-1 select-none font-[family-name:var(--font-sc)] text-[7rem] leading-none text-white/[0.07]">
        {level.zh}
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute left-6 top-4 h-1 w-1 rounded-full bg-white/50" />
      <span aria-hidden="true" className="pointer-events-none absolute right-16 top-8 h-1.5 w-1.5 rounded-full bg-white/40" />
      <span aria-hidden="true" className="pointer-events-none absolute right-8 top-3 h-1 w-1 rounded-full bg-white/30" />

      <div className="relative">
        <div className="flex items-center gap-2 text-xs text-ocean-100">
          <Icon name={icon} className="h-4 w-4 text-star" fill="currentColor" strokeWidth={0} />
          กำลังเดินทางใน
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">{level.name}</h2>
          <span className="font-[family-name:var(--font-sc)] text-lg text-ocean-100">{level.zh}</span>
          {pct !== undefined && <span className="ml-auto text-2xl font-bold tabular-nums text-star">{pct}%</span>}
        </div>
        {pct !== undefined && (
          <div className="mt-2.5">
            <ProgressBar value={pct} tone="star" size="lg" className="bg-white/20" label={`ความคืบหน้า ${level.name}`} />
          </div>
        )}
        {caption && <p className="mt-2 text-xs leading-relaxed text-ocean-100">{caption}</p>}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}
