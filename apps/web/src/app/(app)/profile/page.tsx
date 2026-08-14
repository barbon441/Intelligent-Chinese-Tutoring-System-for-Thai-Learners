"use client";

// 👤 ฉัน — สรุปตัวตนของผู้เรียนกับสถิติภาพรวม (สถิติละเอียดอยู่หน้า "ผลการเดินทาง" ไม่โชว์ซ้ำ)
// ตัวเลขทุกตัวมาจากข้อมูลจริงในเครื่อง + คลังคำ Supabase — ยังไม่มีระบบบัญชีผู้ใช้

import Link from "next/link";
import { useJourney } from "@/lib/journey";
import { Icon, type IconName } from "@/components/Icon";
import { ProgressBar } from "@/components/ProgressBar";
import { LogoMark } from "@/components/Logo";
import { getLevel } from "@/data/levels";
import { QUIZ_TOTAL } from "@/lib/quiz";

export default function Profile() {
  const j = useJourney();
  const passed = j.islands.filter((i) => i.passed).length;
  const quizGot = j.islands.reduce((s, i) => s + (i.quizBest ?? 0), 0);

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* หัวโปรไฟล์ */}
      <section className="flex flex-col items-center gap-2 pt-3">
        <div className="relative">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-ocean-700 to-ocean-900 font-[family-name:var(--font-sc)] text-4xl text-white shadow-lg shadow-ocean-900/25">
            学
          </div>
          <Icon
            name="star"
            className="absolute -right-1 -top-1 h-7 w-7 text-star drop-shadow"
            fill="currentColor"
            strokeWidth={0}
          />
        </div>
        <div className="font-[family-name:var(--font-display)] text-lg font-bold text-ocean-900">
          นักเดินทาง {getLevel("hsk1").name}
        </div>
        <div className="text-sm text-slate-500">เป้าหมาย: สอบผ่าน HSK 1 (120/200)</div>
      </section>

      {/* ความคืบหน้าระดับปัจจุบัน */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-slate-600">ความคืบหน้า HSK 1</span>
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tabular-nums text-ocean-900">{j.levelPct}%</span>
        </div>
        <ProgressBar className="mt-2" size="lg" value={j.learnedWords} max={j.totalWords || 1} label="ความคืบหน้า HSK 1" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat icon="flame" value={String(j.streakDays)} unit="วัน" label="เดินทางต่อเนื่อง" tone="streak" />
          <Stat icon="cards" value={String(j.learnedWords)} unit="คำ" label="คำที่เรียนแล้ว" tone="ocean" />
          <Stat icon="check" value={`${passed}/${j.islands.length}`} unit="" label="หมวดที่ผ่าน" tone="correct" />
        </div>
      </section>

      {/* ลิงก์ดูผลเต็ม */}
      <Link
        href="/progress"
        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm transition hover:border-ocean-300"
      >
        <span className="text-slate-600">
          ฝึกไป {j.totalRounds} รอบ{j.accuracyPct !== null ? ` · ความแม่นยำ ${j.accuracyPct}%` : ""}
          {quizGot > 0 ? ` · คะแนนควิซ ${quizGot}/${j.islands.length * QUIZ_TOTAL}` : ""}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-medium text-ocean-600">
          ดูผลเต็ม <Icon name="arrowRight" className="h-4 w-4" />
        </span>
      </Link>

      {/* เป้าหมายการเรียน */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-600">เส้นทางสู่ HSK 1</h2>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm text-slate-500">
          <GoalItem icon="book" text="คำศัพท์ที่ต้องรู้: 300 คำ" />
          <GoalItem icon="headphone" text="ข้อสอบ: ฟัง + อ่าน (HSK 1–2 ยังไม่สอบพูด)" />
          <GoalItem icon="target" text="เกณฑ์ผ่าน: 120 จาก 200 คะแนน" />
        </ul>
        <Link
          href="/journey"
          className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-ocean-900 px-4 py-2.5 text-center text-sm font-semibold text-white shadow transition hover:bg-ocean-800 active:scale-[0.98]"
        >
          ดูเส้นทางทั้งหมด <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      </section>

      {/* เกี่ยวกับ */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
        <h2 className="mb-2 font-semibold text-slate-600">เกี่ยวกับแอป</h2>
        <div className="mb-2 flex items-center gap-2.5">
          <LogoMark className="h-10 w-10" />
          <div className="leading-tight">
            <div className="font-[family-name:var(--font-sc)] text-lg font-bold text-ocean-900">星航</div>
            <div className="text-[10px] font-medium tracking-[0.14em] text-ocean-500">XĪNG HÁNG</div>
          </div>
        </div>
        <p className="leading-relaxed">
          <span className="font-medium text-slate-700">星 = ดาว · 航 = การเดินทาง</span> — ผู้ช่วยเตรียมสอบ HSK สำหรับคนไทย
          เรียนคำศัพท์เป็นหมวด ฝึกฟัง-อ่านแบบข้อสอบจริง และทวนตามจังหวะที่จำได้ดีที่สุด
        </p>
        <p className="mt-2 rounded-xl bg-ocean-50 p-3 text-xs italic leading-relaxed text-ocean-700">
          “ไม่ต้องรู้ว่าจะไปทางไหน แค่เดินตามดาวก็พอ”
        </p>
        <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
          โปรเจกต์นักศึกษาวิทยาการคอมพิวเตอร์ ม.แม่โจ้
          <br />
          วรเดช ปิ่นทอง · หฤทัย ยุวรัตน์
        </div>
      </section>

      <p className="pb-2 text-center text-[11px] text-slate-400">
        เวอร์ชันพัฒนา · ระบบล็อกอิน/โปรไฟล์รายบุคคลจะเพิ่มในเฟสถัดไป ·{" "}
        <Link href="/roadmap" className="underline hover:text-slate-600">
          แผนพัฒนา (ทีม)
        </Link>
      </p>
    </div>
  );
}

function Stat({
  icon,
  value,
  unit,
  label,
  tone,
}: {
  icon: IconName;
  value: string;
  unit: string;
  label: string;
  tone: "streak" | "ocean" | "correct";
}) {
  const cls = { streak: "text-streak", ocean: "text-ocean-700", correct: "text-correct" }[tone];
  return (
    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
      <Icon name={icon} className={`mx-auto h-4 w-4 ${cls}`} />
      <div className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold leading-none text-ocean-900">
        {value}
        {unit && <span className="ml-0.5 text-[11px] font-normal text-slate-400">{unit}</span>}
      </div>
      <div className="mt-1 text-[10px] leading-tight text-slate-500">{label}</div>
    </div>
  );
}

function GoalItem({ icon, text }: { icon: IconName; text: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ocean-50 text-ocean-700">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      {text}
    </li>
  );
}
