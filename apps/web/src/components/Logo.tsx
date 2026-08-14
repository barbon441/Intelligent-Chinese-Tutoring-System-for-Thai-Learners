// โลโก้ 星航 (Xīng Háng) — ดาวนำทางเหนือผิวน้ำ
// ตั้งใจให้เรียบจนย่อเหลือ 16px ยังอ่านออก (favicon/app icon) → มีแค่ 3 อย่าง: ท้องฟ้า · ดาว · คลื่น
// zero dependency · ใช้ currentColor ไม่ได้เพราะเป็นโลโก้หลายสี — สีฝังใน SVG

export function LogoMark({
  className = "h-9 w-9",
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="星航">
      <defs>
        <linearGradient id="xh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#133758" />
          <stop offset="100%" stopColor="#0d2440" />
        </linearGradient>
      </defs>
      {/* ท้องฟ้ากลางคืน */}
      <rect width="48" height="48" rx="13" fill="url(#xh-sky)" />
      {/* ดาวเล็กประกอบ — บอกว่าเป็นท้องฟ้า ไม่ใช่แค่พื้นน้ำเงิน */}
      <circle cx="11" cy="12" r="1.3" fill="#8fbde5" opacity="0.8" />
      <circle cx="38" cy="10" r="1" fill="#8fbde5" opacity="0.6" />
      <circle cx="36.5" cy="24" r="1.15" fill="#8fbde5" opacity="0.5" />
      {/* ดาวนำทาง 4 แฉก */}
      <path
        d="M24 8 26.4 16.6 35 19 26.4 21.4 24 30 21.6 21.4 13 19 21.6 16.6Z"
        fill="#f4b740"
        className={animated ? "twinkle" : undefined}
      />
      {/* ผิวน้ำ 2 ชั้น */}
      <path d="M4 35q5-3.4 10 0t10 0 10 0 10 0" fill="none" stroke="#5b98d0" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M4 41q5-3.4 10 0t10 0 10 0 10 0" fill="none" stroke="#245f97" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// โลโก้เต็ม = ตรา + ชื่อจีน + พินอิน (ใช้ใน header / หน้าเริ่ม)
export function Logo({
  className = "",
  markClassName = "h-9 w-9",
  showPinyin = true,
  animated = false,
}: {
  className?: string;
  markClassName?: string;
  showPinyin?: boolean;
  animated?: boolean;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} animated={animated} />
      <span className="flex flex-col leading-none">
        <span className="font-[family-name:var(--font-sc)] text-xl font-bold tracking-wide text-ocean-900">星航</span>
        {showPinyin && <span className="mt-0.5 text-[10px] font-medium tracking-[0.14em] text-ocean-500">XĪNG HÁNG</span>}
      </span>
    </span>
  );
}
