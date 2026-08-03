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

      {/* ลิงก์ดูผล (สถิติเต็มอยู่หน้า ผล — ไม่โชว์ซ้ำ) */}
      <Link
        href="/progress"
        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 text-sm transition hover:border-ink-300"
      >
        <span className="text-slate-600">
          ฝึกไป {rounds} รอบ{acc !== null ? ` · ความแม่นยำ ${acc}%` : ""}
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-ink-500">
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
          href="/practice"
          className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-ink-700 px-4 py-2.5 text-center text-sm font-semibold text-white shadow transition hover:bg-ink-900"
        >
          ฝึกทำข้อสอบต่อ <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      </section>

      {/* เกี่ยวกับ */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
        <h2 className="mb-2 font-semibold text-slate-600">เกี่ยวกับแอป</h2>
        <p className="leading-relaxed">
          <span className="font-medium text-slate-700">中文知心</span> — ผู้ช่วยเตรียมสอบ HSK สำหรับคนไทย
          เรียนคำศัพท์เป็นหมวด ฝึกฟัง-อ่านแบบข้อสอบจริง และทวนตามจังหวะที่จำได้ดีที่สุด
        </p>
        <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
          โปรเจกต์นักศึกษาวิทยาการคอมพิวเตอร์ ม.แม่โจ้
          <br />
          วรเดช ปิ่นทอง · หฤทัย ยุวรัตน์
        </div>

      </section>

      <p className="pb-2 text-center text-[11px] text-slate-300">
        เวอร์ชันพัฒนา · ระบบล็อกอิน/โปรไฟล์รายบุคคลจะเพิ่มในเฟสถัดไป ·{" "}
        <Link href="/roadmap" className="underline hover:text-slate-500">แผนพัฒนา (ทีม)</Link>
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
