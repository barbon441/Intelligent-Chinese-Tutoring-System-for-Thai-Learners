// มาสคอต 小星 (Xiǎo Xīng) — "ดาวดวงเล็กที่คอยนำทาง"
// บุคลิก: ใจดี ใจเย็น ให้กำลังใจ — ไม่เด็กเกินไป ไม่เป็นหุ่นยนต์
// กติกาการใช้: โผล่เท่าที่จำเป็น (ทักทาย · สถานะว่าง · ให้ฟีดแบ็ก · แนะนำ) ไม่ต้องมีทุกหน้า

export function Mascot({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="小星 ดาวนำทาง">
      {/* แสงเรือง — ทำให้ดูอบอุ่น ไม่ลอยโดด */}
      <circle cx="32" cy="32" r="27" fill="#f4b740" opacity="0.16" />
      {/* ตัวดาว 4 แฉก */}
      <path
        d="M32 5 39.8 24.2 59 32 39.8 39.8 32 59 24.2 39.8 5 32 24.2 24.2Z"
        fill="#f4b740"
        stroke="#d1911c"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* แก้ม */}
      <ellipse cx="24.6" cy="34.4" rx="2.6" ry="1.7" fill="#e2685a" opacity="0.3" />
      <ellipse cx="39.4" cy="34.4" rx="2.6" ry="1.7" fill="#e2685a" opacity="0.3" />
      {/* ตา */}
      <ellipse cx="28" cy="29.8" rx="1.9" ry="2.3" fill="#0d2440" />
      <ellipse cx="36" cy="29.8" rx="1.9" ry="2.3" fill="#0d2440" />
      {/* ยิ้มบาง ๆ */}
      <path d="M28.9 35.4q3.1 2.7 6.2 0" fill="none" stroke="#0d2440" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 小星 พูด — การ์ดคำพูดพร้อมหางชี้กลับไปที่ตัวมาสคอต
export function MascotSays({
  children,
  className = "",
  mascotClassName = "h-12 w-12",
}: {
  children: React.ReactNode;
  className?: string;
  mascotClassName?: string;
}) {
  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <Mascot className={`${mascotClassName} shrink-0`} />
      <div className="relative flex-1 rounded-2xl rounded-tl-md bg-star-soft px-3.5 py-2.5 text-sm leading-relaxed text-star-ink">
        {/* หางการ์ด */}
        <span className="absolute -left-1.5 top-3 h-3 w-3 rotate-45 bg-star-soft" aria-hidden="true" />
        <span className="relative">{children}</span>
      </div>
    </div>
  );
}
