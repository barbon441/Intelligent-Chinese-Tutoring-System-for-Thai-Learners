"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadRounds, summarize } from "@/lib/progress";
import { Icon, type IconName } from "@/components/Icon";

export default function Profile() {
  const [acc, setAcc] = useState<number | null>(null);
  const [rounds, setRounds] = useState(0);

  useEffect(() => {
    const s = summarize(loadRounds());
    setRounds(s.totalRounds);
    setAcc(s.totalQuestions ? Math.round(s.accuracy * 100) : null);
  }, []);

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* หัวโปรไฟล์ */}
      <section className="flex flex-col items-center gap-2 pt-4">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-ink-700 to-ink-900 font-[family-name:var(--font-sc)] text-4xl text-white shadow-lg">
          学
        </div>
        <div className="text-lg font-semibold text-slate-700">ผู้เรียน HSK 1</div>
        <div className="text-sm text-slate-400">เป้าหมาย: สอบผ่าน HSK 1 (120/200)</div>
      </section>

      {/* สรุปสั้น */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-sky-700">{rounds}</div>
          <div className="mt-1 text-xs text-slate-500">รอบที่ฝึก</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-pink-600">{acc === null ? "—" : `${acc}%`}</div>
          <div className="mt-1 text-xs text-slate-500">ความแม่นยำรวม</div>
        </div>
      </section>

      {/* เป้าหมายการเรียน */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-600">เส้นทางสู่ HSK 1</h2>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm text-slate-500">
          <GoalItem icon="book" text="คำศัพท์ที่ต้องรู้: 300 คำ" />
          <GoalItem icon="headphone" text="ข้อสอบ: ฟัง + อ่าน (HSK 1–2 ยังไม่สอบพูด)" />
          <GoalItem icon="target" text="เกณฑ์ผ่าน: 120 จาก 200 คะแนน" />
        </ul>
        <Link
          href="/practice"
          className="mt-4 block rounded-xl bg-sky-700 px-4 py-2.5 text-center text-sm font-medium text-white shadow hover:bg-sky-800"
        >
          ฝึกทำข้อสอบต่อ →
        </Link>
      </section>

      {/* เกี่ยวกับ */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
        <h2 className="mb-2 font-semibold text-slate-600">เกี่ยวกับแอป</h2>
        <p className="leading-relaxed">
          <span className="font-medium text-slate-700">中文知心</span> — ติวเตอร์เตรียมสอบ
          HSK อัจฉริยะสำหรับคนไทย วินิจฉัยจุดที่คนไทยมักพลาด (Thai-L1) แล้วเจาะติวรายทักษะ
        </p>
        <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
          โปรเจกต์นักศึกษาวิทยาการคอมพิวเตอร์ ม.แม่โจ้
          <br />
          วรเดช ปิ่นทอง · หฤทัย ยุวรัตน์
        </div>
        <Link
          href="/roadmap"
          className="mt-3 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-100"
        >
          <span className="inline-flex items-center gap-2">
            <Icon name="target" className="h-4 w-4" /> แผนพัฒนาระบบ (Roadmap)
          </span>
          <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      </section>

      <p className="pb-2 text-center text-[11px] text-slate-300">
        เวอร์ชันพัฒนา · ระบบล็อกอิน/โปรไฟล์รายบุคคลจะเพิ่มในเฟสถัดไป
      </p>
    </div>
  );
}

function GoalItem({ icon, text }: { icon: IconName; text: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink-50 text-ink-700">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      {text}
    </li>
  );
}
