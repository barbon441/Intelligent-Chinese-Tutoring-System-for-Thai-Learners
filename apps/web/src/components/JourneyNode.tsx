// จุดหนึ่งจุดบน "เส้นทางเดินเรือ" — ใช้ตัวเดียวกันทุกระดับ (Foundation / HSK 1 / HSK 2 / ... / HSK 6)
// ต่างกันแค่ props ที่ส่งเข้ามา ไม่ต้องเขียนหน้าใหม่ตอนเพิ่มระดับ
//
// หมายเหตุกติกาโปรเจกต์: หมวดที่ยังไม่ถึง = "upcoming" ไม่ใช่ "locked" — กดเข้าไปเรียนก่อนได้
// (PA-09/PA-10: ระบบแนะนำ ไม่บังคับ) · ใช้ locked เฉพาะของที่ยังไม่มีจริง เช่น HSK 2

import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { ProgressBar } from "@/components/ProgressBar";

export type NodeStatus = "done" | "current" | "upcoming" | "locked";

const MARKER: Record<NodeStatus, string> = {
  done: "border-correct bg-correct text-white",
  current: "border-star bg-star text-ocean-900 shadow-lg shadow-star/40",
  upcoming: "border-ocean-200 bg-white text-ocean-400",
  locked: "border-slate-200 bg-slate-100 text-slate-400",
};

const CARD: Record<NodeStatus, string> = {
  done: "border-emerald-100 bg-white",
  current: "border-star/50 bg-star-soft shadow-md shadow-star/10",
  upcoming: "border-slate-100 bg-white",
  locked: "border-slate-100 bg-slate-50",
};

const TITLE: Record<NodeStatus, string> = {
  done: "text-slate-700",
  current: "text-ocean-900",
  upcoming: "text-slate-700",
  locked: "text-slate-400",
};

export function JourneyNode({
  status,
  icon,
  title,
  subtitle,
  href,
  progress,
  badge,
  last = false,
  emphasis = false,
}: {
  status: NodeStatus;
  icon: IconName;
  title: string;
  subtitle?: string;
  href?: string;
  /** ความคืบหน้าของจุดนี้ — ไม่ส่ง = ไม่ต้องโชว์แถบ */
  progress?: { value: number; max: number; text?: string };
  badge?: string;
  last?: boolean;
  /** จุดหมายสำคัญ (หัวระดับ / เส้นชัย) — ตัวใหญ่ขึ้นเล็กน้อย */
  emphasis?: boolean;
}) {
  // ไอคอนบนหมุด: เสร็จแล้ว = ติ๊ก · กำลังอยู่ = ดาว · ยังไม่มีจริง = กุญแจ · นอกนั้นใช้ไอคอนของจุดนั้น
  const markerIcon: IconName = status === "done" ? "check" : status === "current" ? "star" : status === "locked" ? "lock" : icon;

  const card = (
    <div className={`min-w-0 flex-1 rounded-2xl border p-3.5 transition ${CARD[status]} ${href ? "hover:border-ocean-300 hover:shadow-sm" : ""}`}>
      <div className="flex items-center gap-2">
        <span className={`min-w-0 flex-1 truncate font-semibold ${emphasis ? "text-base" : "text-sm"} ${TITLE[status]}`}>{title}</span>
        {badge && (
          <span
            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
              status === "done"
                ? "bg-emerald-50 text-correct"
                : status === "current"
                  ? "bg-star text-ocean-900"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {badge}
          </span>
        )}
        {href && <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-slate-300" />}
      </div>
      {subtitle && <p className={`mt-0.5 text-xs leading-snug ${status === "locked" ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>}
      {progress && (
        <div className="mt-2 flex items-center gap-2">
          <ProgressBar
            value={progress.value}
            max={progress.max}
            size="sm"
            tone={status === "done" ? "correct" : "ocean"}
            label={`ความคืบหน้า ${title}`}
          />
          <span className="shrink-0 text-[10px] tabular-nums text-slate-400">{progress.text ?? `${progress.value}/${progress.max}`}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex gap-3 pb-3">
      {/* เส้นทางเดินเรือที่ลากต่อไปจุดถัดไป */}
      {!last && (
        <span
          aria-hidden="true"
          className={`absolute bottom-0 left-[21px] top-11 w-0.5 rounded-full ${status === "done" ? "bg-correct/40" : "bg-ocean-200"}`}
        />
      )}
      <div className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 ${MARKER[status]}`}>
        <Icon
          name={markerIcon}
          className="h-5 w-5"
          strokeWidth={status === "done" ? 2.6 : 1.9}
          {...(status === "current" ? { fill: "currentColor" } : {})}
        />
      </div>
      {href ? (
        <Link href={href} className="flex min-w-0 flex-1 active:scale-[0.99]">
          {card}
        </Link>
      ) : (
        card
      )}
    </div>
  );
}
