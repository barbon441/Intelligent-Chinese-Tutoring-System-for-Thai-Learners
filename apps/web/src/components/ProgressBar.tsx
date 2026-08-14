// แถบความคืบหน้า — เดิมก๊อปโค้ดเดียวกันอยู่ 7 ที่แล้วเริ่มเพี้ยนกัน (สูงไม่เท่า สีไม่เท่า) รวมไว้ที่เดียว
// ใช้ได้ทุกระดับ (Foundation / HSK 1 / HSK 2) — ต่างกันแค่ค่าที่ส่งเข้ามา

const TONES = {
  ocean: "bg-gradient-to-r from-ocean-400 to-ocean-700",
  correct: "bg-correct",
  star: "bg-gradient-to-r from-star to-star-dark",
} as const;

const SIZES = { sm: "h-1", md: "h-1.5", lg: "h-2" } as const;

export function ProgressBar({
  value,
  max = 100,
  tone = "ocean",
  size = "md",
  className = "",
  label,
}: {
  value: number;
  max?: number;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
  className?: string;
  /** ข้อความบอกความหมายให้ screen reader (ถ้าไม่ส่ง จะอ่านเป็นเปอร์เซ็นต์เฉย ๆ) */
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full overflow-hidden rounded-full bg-ocean-100 ${SIZES[size]} ${className}`}
    >
      <div className={`${SIZES[size]} rounded-full transition-all duration-500 ${TONES[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
