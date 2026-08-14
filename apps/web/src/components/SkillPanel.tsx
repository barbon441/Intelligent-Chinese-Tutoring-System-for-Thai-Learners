// แผงคะแนนรายทักษะ — ใช้ซ้ำทุกที่ที่ต้องแสดง "แยกตามทักษะ" (ผล pre-test / ภาพรวมหมวด / ประเมินท้ายหมวด / readiness)
// กรอบที่อาจารย์ย้ำ: ห้ามโชว์แค่คะแนนรวม ต้องเห็นว่าแข็งตรงไหน อ่อนตรงไหน

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ProgressBar } from "@/components/ProgressBar";
import { MascotSays } from "@/components/Mascot";
import { SKILLS, strongest, weakest, skillLabel, type SkillScores, type SkillId } from "@/data/mockData";

// สีแถบบอกระดับความแม่น: แน่นแล้ว = เขียว · กลาง ๆ = น้ำเงิน · ควรฝึกเพิ่ม = เหลืองดาว
type BarTone = "correct" | "ocean" | "star";
const TONE = (pct: number): BarTone => (pct >= 80 ? "correct" : pct >= 60 ? "ocean" : "star");

export function SkillBars({
  scores,
  highlightWeakest = true,
  size = "md",
}: {
  scores: SkillScores;
  highlightWeakest?: boolean;
  size?: "sm" | "md";
}) {
  const weak = weakest(scores);
  return (
    <div className="flex flex-col gap-2.5">
      {SKILLS.map((s) => {
        const pct = scores[s.id];
        const isWeak = highlightWeakest && s.id === weak;
        return (
          <div key={s.id}>
            <div className="mb-1 flex items-center gap-2 text-xs">
              <Icon name={s.icon} className={`h-3.5 w-3.5 ${isWeak ? "text-star-dark" : "text-ocean-500"}`} />
              <span className={`flex-1 ${isWeak ? "font-semibold text-ocean-900" : "text-slate-600"}`}>{s.label}</span>
              {isWeak && (
                <span className="rounded bg-star-soft px-1.5 py-0.5 text-[10px] font-bold text-star-ink">ควรฝึกเพิ่ม</span>
              )}
              <span className="tabular-nums font-semibold text-ocean-900">{pct}%</span>
            </div>
            <ProgressBar value={pct} size={size === "sm" ? "sm" : "md"} tone={TONE(pct)} label={`ความแม่นยำ${s.label}`} />
          </div>
        );
      })}
    </div>
  );
}

/** สรุป "จุดแข็ง / จุดที่ควรฝึก" + คำแนะนำจาก 小星 */
export function SkillVerdict({ scores, actionHref }: { scores: SkillScores; actionHref?: string }) {
  const best = strongest(scores);
  const weak = weakest(scores);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
          <div className="text-[11px] font-semibold text-correct">จุดแข็ง</div>
          <div className="mt-0.5 font-semibold text-ocean-900">{skillLabel(best)}</div>
          <div className="text-xs tabular-nums text-slate-500">{scores[best]}%</div>
        </div>
        <div className="rounded-xl border border-star/40 bg-star-soft p-3">
          <div className="text-[11px] font-semibold text-star-ink">จุดที่ควรฝึก</div>
          <div className="mt-0.5 font-semibold text-ocean-900">{skillLabel(weak)}</div>
          <div className="text-xs tabular-nums text-slate-500">{scores[weak]}%</div>
        </div>
      </div>

      <MascotSays mascotClassName="h-10 w-10">ลองฝึก{skillLabel(weak)}เพิ่มอีกนิด แล้วค่อยเดินทางต่อนะ ⭐</MascotSays>

      {actionHref && (
        <Link
          href={actionHref}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ocean-900 px-4 py-3 font-semibold text-white shadow transition hover:bg-ocean-800 active:scale-[0.98]"
        >
          ฝึก{skillLabel(weak)} <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/** เทียบก่อนเรียน → ตอนนี้ ทีละทักษะ พร้อมส่วนต่าง */
export function SkillDelta({ before, after }: { before: SkillScores; after: SkillScores }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-b border-slate-100 bg-ocean-50/60 px-4 py-2 text-[11px] font-semibold text-slate-500">
        <span>ทักษะ</span>
        <span className="w-11 text-right">ก่อนเรียน</span>
        <span className="w-11 text-right">ตอนนี้</span>
        <span className="w-12 text-right">เปลี่ยน</span>
      </div>
      {SKILLS.map((s, i) => {
        const b = before[s.id];
        const a = after[s.id];
        const d = a - b;
        return (
          <div
            key={s.id}
            className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-4 py-2.5 ${i > 0 ? "border-t border-slate-50" : ""}`}
          >
            <span className="flex items-center gap-2 text-sm text-slate-700">
              <Icon name={s.icon} className="h-4 w-4 text-ocean-500" />
              {s.label}
            </span>
            <span className="w-11 text-right text-sm tabular-nums text-slate-400">{b}%</span>
            <span className="w-11 text-right text-sm font-semibold tabular-nums text-ocean-900">{a}%</span>
            <span
              className={`w-12 text-right text-sm font-bold tabular-nums ${
                d > 0 ? "text-correct" : d < 0 ? "text-coral" : "text-slate-400"
              }`}
            >
              {d > 0 ? "+" : ""}
              {d}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** วงกลมคะแนนรวมใหญ่ ๆ (ใช้ในผล pre-test และ readiness) */
export function ScoreRing({ pct, caption, label }: { pct: number; caption?: string; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 128 128" className="h-32 w-32" role="img" aria-label={`${label} ${pct} เปอร์เซ็นต์`}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="11" className="text-ocean-100" />
        <circle
          cx="64" cy="64" r={r} fill="none" strokeWidth="11" strokeLinecap="round"
          stroke="#f4b740"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 64 64)"
        />
        <text x="64" y="66" textAnchor="middle" className="fill-ocean-900" fontSize="30" fontWeight="700">{pct}%</text>
        <text x="64" y="86" textAnchor="middle" className="fill-slate-400" fontSize="11">{label}</text>
      </svg>
      {caption && <p className="mt-1 text-center text-sm text-slate-500">{caption}</p>}
    </div>
  );
}

export type { SkillId };
