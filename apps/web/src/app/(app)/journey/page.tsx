"use client";

// 🧭 เส้นทาง — ภาพรวมการเดินทางทั้งหมดของผู้เรียน (Foundation → HSK 1 → HSK 2)
// เจตนา: ตอบคำถาม "ฉันอยู่ตรงไหน แล้วข้างหน้าคืออะไร" ในจอเดียว ไม่ต้องเลื่อนหาหลายหน้า
//
// ทุกจุดบนเส้นทางใช้ <JourneyNode> ตัวเดียวกัน — เพิ่ม HSK 3–6 ทีหลังคือเพิ่มข้อมูล ไม่ใช่เพิ่มหน้า
// สถานะที่ใช้: ✓ ผ่านแล้ว · ⭐ กำลังอยู่ตรงนี้ · ○ ยังไม่ถึง (กดเข้าไปเรียนก่อนได้ ไม่ล็อก — PA-09)
//              🔒 ใช้เฉพาะของที่ยังไม่มีจริง (Foundation กำลังสร้าง · HSK 2 ยังไม่เปิด)

import Link from "next/link";
import { useJourney } from "@/lib/journey";
import { JourneyNode } from "@/components/JourneyNode";
import { LevelCard } from "@/components/LevelCard";
import { MascotSays } from "@/components/Mascot";
import { Center } from "@/components/Feedback";
import { Icon } from "@/components/Icon";
import { getLevel } from "@/data/levels";
import { QUIZ_TOTAL } from "@/lib/quiz";

export default function Journey() {
  const j = useJourney();

  if (j.loading) return <Center>กำลังกางแผนที่การเดินทาง...</Center>;

  const passedCount = j.islands.filter((i) => i.passed).length;
  const allPassed = passedCount === j.islands.length && j.islands.length > 0;
  const quizGot = j.islands.reduce((s, i) => s + (i.quizBest ?? 0), 0);
  const quizFull = j.islands.length * QUIZ_TOTAL;

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-ocean-900">เส้นทางเดินเรือของคุณ</h1>
        <p className="mt-0.5 text-sm text-slate-500">ผ่านมาแล้ว {passedCount} จาก {j.islands.length} หมวดของ HSK 1</p>
      </header>

      <MascotSays>ไม่ต้องรู้ว่าจะไปทางไหนก็ได้ — เดินตามดาวไปทีละจุดพอ ⭐</MascotSays>

      <LevelCard
        level={getLevel("hsk1")}
        active
        pct={j.levelPct}
        caption={`เริ่มเรียนไปแล้ว ${j.learnedWords} จาก ${j.totalWords || "…"} คำ · คะแนนควิซเก็บ ${quizGot}/${quizFull}`}
        footer={
          j.current ? (
            <Link
              href={`/learn/category?cat=${j.current.cat.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-ocean-900 shadow transition active:scale-[0.98]"
            >
              <Icon name="play" className="h-4 w-4 text-star-dark" fill="currentColor" strokeWidth={0} />
              ไปต่อที่หมวด {j.current.cat.id}
            </Link>
          ) : undefined
        }
      />

      {/* ---------- เส้นทาง ---------- */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">จุดแวะทั้งหมด</h2>

        <JourneyNode
          status="locked"
          icon="speaker"
          title="ปูพื้นฐานเสียง"
          subtitle="พินอินเทียบเสียงไทย · วรรณยุกต์ · เกมฝึกหู — กำลังสร้าง ระหว่างนี้เริ่มที่หมวด 1 ได้เลย"
          badge="กำลังสร้าง"
        />

        <JourneyNode
          status="current"
          icon="star"
          title="HSK 1 — 5 หมวด 300 คำ"
          subtitle="หมวดเรียงตามสถานการณ์จริง ทักทายก่อน แล้วค่อยไปเรื่องที่ใช้บ่อยรองลงมา"
          progress={{ value: j.learnedWords, max: j.totalWords || 1, text: `${j.levelPct}%` }}
          emphasis
        />

        {j.islands.map((island) => (
          <JourneyNode
            key={island.cat.id}
            status={island.status}
            icon={island.cat.icon}
            title={`หมวด ${island.cat.id} · ${island.cat.name}`}
            subtitle={island.cat.desc}
            href={`/learn/category?cat=${island.cat.id}`}
            progress={island.total > 0 ? { value: island.learned, max: island.total, text: `${island.learned}/${island.total} คำ` } : undefined}
            badge={
              island.passed
                ? `ผ่าน ${island.quizBest}/${QUIZ_TOTAL}`
                : island.quizBest !== null
                  ? `ควิซ ${island.quizBest}/${QUIZ_TOTAL}`
                  : island.status === "current"
                    ? "อยู่ตรงนี้"
                    : undefined
            }
          />
        ))}

        <JourneyNode
          status={allPassed ? "done" : "upcoming"}
          icon="target"
          title="ผ่านครบทั้ง 5 หมวดของ HSK 1"
          subtitle={
            allPassed
              ? "ครบแล้ว! ลองฝึกทำข้อสอบรวมให้คล่องมือก่อนออกเดินทางต่อ"
              : `ต้องผ่านควิซท้ายหมวดให้ครบทุกหมวด — ตอนนี้ ${passedCount}/${j.islands.length}`
          }
          emphasis
        />

        <JourneyNode
          status="locked"
          icon="ship"
          title="HSK 2 — เส้นทางถัดไป"
          subtitle="เส้นทางใหม่กำลังรอคุณอยู่ · หน้าจอรองรับแล้ว รอเนื้อหาและคลังคำ"
          badge="เร็ว ๆ นี้"
          last
        />
      </section>

      <p className="pb-2 text-center text-[11px] leading-relaxed text-slate-400">
        หมวดที่ยังไม่ถึงไม่ได้ล็อกไว้ — อยากข้ามไปดูก่อนก็กดเข้าไปได้เลย
      </p>
    </div>
  );
}
