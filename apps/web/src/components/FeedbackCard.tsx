// การ์ดเฉลยหลังตอบ — ใช้ร่วมกันทุกที่ที่มีการตรวจคำตอบ (ฝึกฟัง / ฝึกอ่าน / เรียงประโยค / ควิซ)
//
// กติกาถ้อยคำ (สำคัญกว่าดีไซน์): ตอบผิดห้ามใช้คำตัดสิน เช่น "ผิด" / "WRONG"
// ต้องบอก 3 อย่างเสมอ — คุณเลือกอะไร · ที่ถูกคืออะไร · เพราะอะไร
// เพราะผู้เรียนกลุ่มนี้คือคนไม่มีพื้นฐาน ถ้ารู้สึกโดนดุตั้งแต่ข้อแรกจะเลิกกลางทาง

import { Icon } from "@/components/Icon";
import { Mascot } from "@/components/Mascot";

export type AnswerFace = {
  main: string; // ตัวหลัก (จีน หรือ คำแปลไทย แล้วแต่โหมด)
  sub?: string; // บรรทัดรอง (พินอิน / ความหมาย)
  chinese?: boolean; // main เป็นตัวอักษรจีนไหม (ใช้เลือกฟอนต์)
};

export function FeedbackCard({
  correct,
  yourAnswer,
  rightAnswer,
  hint,
  children,
}: {
  correct: boolean;
  /** สิ่งที่ผู้เรียนเลือก — ไม่ส่งเมื่อตอบถูก */
  yourAnswer?: AnswerFace;
  rightAnswer: AnswerFace;
  hint?: string;
  /** ปุ่มต่อท้าย เช่น "ลองฝึกคำนี้อีกครั้ง" */
  children?: React.ReactNode;
}) {
  if (correct) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-4">
        <div className="flex items-center gap-1.5 font-semibold text-correct">
          <Icon name="check" className="h-5 w-5" strokeWidth={2.6} />
          ถูกต้อง!
        </div>
        {hint && <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{hint}</p>}
        {children && <div className="mt-3">{children}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-coral/25 bg-coral-soft p-4">
      <div className="flex items-center gap-2">
        <Mascot className="h-9 w-9 shrink-0" />
        <span className="font-semibold text-ocean-900">ลองอีกครั้งนะ</span>
      </div>

      <dl className="mt-3 flex flex-col gap-2">
        {yourAnswer && <Row label="คุณเลือก" face={yourAnswer} muted />}
        <Row label="คำตอบที่ถูก" face={rightAnswer} />
      </dl>

      {hint && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-white/70 p-2.5 text-xs leading-relaxed text-slate-600">
          <Icon name="bulb" className="mt-0.5 h-4 w-4 shrink-0 text-star-dark" />
          {hint}
        </p>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

function Row({ label, face, muted = false }: { label: string; face: AnswerFace; muted?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-[86px] shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span
          className={`${face.chinese ? "font-[family-name:var(--font-sc)] text-xl" : "text-base"} font-semibold ${
            muted ? "text-slate-500 line-through decoration-coral/50" : "text-ocean-900"
          }`}
        >
          {face.main}
        </span>
        {face.sub && <span className="text-xs text-slate-500">{face.sub}</span>}
      </dd>
    </div>
  );
}
