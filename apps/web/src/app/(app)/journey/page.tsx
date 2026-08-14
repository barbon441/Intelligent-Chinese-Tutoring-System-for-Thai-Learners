"use client";

// 🧭 เส้นทาง — ภาพรวมทั้งระบบในจอเดียว
// นี่คือหน้าที่ตอบกรอบที่อาจารย์ขอ: Content × Skill × Assessment × Level เชื่อมกันยังไง
//
//   แบบทดสอบก่อนเรียน → พื้นฐานเสียง → 5 หมวด → ข้อสอบเสมือนจริง → ความพร้อมสอบ → HSK 2
//
// ทุกจุดใช้ <JourneyNode> ตัวเดียวกัน — เพิ่ม HSK 3–6 ทีหลังคือเพิ่มข้อมูล ไม่ใช่เพิ่มหน้า
// สถานะ: ✓ ผ่านแล้ว · ⭐ กำลังอยู่ตรงนี้ · ○ ยังไม่ถึง (กดเข้าไปก่อนได้ ไม่ล็อก — PA-09) · 🔒 ยังไม่มีจริง

import { useEffect, useState } from "react";
import Link from "next/link";
import { useJourney } from "@/lib/journey";
import { JourneyNode, type NodeStatus } from "@/components/JourneyNode";
import { LevelCard } from "@/components/LevelCard";
import { MascotSays } from "@/components/Mascot";
import { Center } from "@/components/Feedback";
import { Icon } from "@/components/Icon";
import { getLevel } from "@/data/levels";
import { QUIZ_TOTAL } from "@/lib/quiz";
import { loadPretest, loadMockTest, overall } from "@/data/mockData";

export default function Journey() {
  const j = useJourney();
  const [pretestPct, setPretestPct] = useState<number | null>(null);
  const [mockPct, setMockPct] = useState<number | null>(null);

  // อ่านผลที่เก็บไว้ในเครื่อง — ทำใน microtask เพื่อไม่ setState ตรง ๆ ในตัว effect
  useEffect(() => {
    queueMicrotask(() => {
      const pre = loadPretest();
      if (pre) setPretestPct(overall(pre.skills));
      const mt = loadMockTest();
      if (mt) setMockPct(overall(mt.skills));
    });
  }, []);

  if (j.loading) return <Center>กำลังกางแผนที่การเดินทาง...</Center>;

  const passedCount = j.islands.filter((i) => i.passed).length;
  const allPassed = passedCount === j.islands.length && j.islands.length > 0;
  const quizGot = j.islands.reduce((s, i) => s + (i.quizBest ?? 0), 0);
  const quizFull = j.islands.length * QUIZ_TOTAL;

  const pretestDone = pretestPct !== null;
  const preStatus: NodeStatus = pretestDone ? "done" : "current";

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-ocean-900">เส้นทางเดินเรือของคุณ</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          ผ่านมาแล้ว {passedCount} จาก {j.islands.length} หมวดของ HSK 1
        </p>
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

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">จุดแวะทั้งหมด</h2>

        {/* ① วัดพื้นก่อนออกเดินทาง */}
        <JourneyNode
          status={preStatus}
          icon="target"
          title="แบบทดสอบก่อนเรียน"
          subtitle={
            pretestDone
              ? "เก็บคะแนนฐานไว้แล้ว — ใช้เทียบตอนเรียนไปสักพักว่าดีขึ้นแค่ไหน"
              : "ทำครั้งเดียวตอนเริ่ม เพื่อรู้ว่าตอนนี้พื้นอยู่ตรงไหน และควรเริ่มที่ใด"
          }
          href="/pretest"
          badge={pretestDone ? `${pretestPct}%` : "เริ่มที่นี่"}
          emphasis
        />

        {/* ② พื้นฐานเสียง — เป็น content หนึ่ง ไม่ใช่ระดับแยก */}
        <JourneyNode
          status="upcoming"
          icon="speaker"
          title="พื้นฐานเสียง"
          subtitle="พินอิน · วรรณยุกต์ 4 เสียง · ฝึกหูแยกเสียง — พื้นดีอยู่แล้วข้ามได้เลย ไม่ล็อก"
          href="/foundation"
        />

        {/* ③ ระดับ HSK 1 */}
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
            progress={
              island.total > 0
                ? { value: island.learned, max: island.total, text: `${island.learned}/${island.total} คำ` }
                : undefined
            }
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

        {/* ④ วัดภาพรวมข้ามทุกหมวด */}
        <JourneyNode
          status={mockPct !== null ? "done" : allPassed ? "current" : "upcoming"}
          icon="flask"
          title="ข้อสอบเสมือนจริง HSK 1"
          subtitle="20 ข้อ 25 นาที ครอบทั้ง 5 หมวด — จับเวลาเหมือนสนามสอบ"
          href="/mock-test"
          badge={mockPct !== null ? `${mockPct}%` : undefined}
        />

        <JourneyNode
          status={mockPct !== null ? "done" : "upcoming"}
          icon="chart"
          title="ความพร้อมสอบ HSK 1"
          subtitle="คะแนนแยกรายทักษะ + เทียบกับตอนก่อนเรียน ว่าพัฒนาขึ้นเท่าไหร่"
          href="/mock-test/result"
          emphasis
        />

        {/* ⑤ ระดับถัดไป */}
        <JourneyNode
          status="locked"
          icon="ship"
          title="HSK 2 — เส้นทางถัดไป"
          subtitle="ใช้หน้าจอและ component ชุดเดียวกับ HSK 1 · รอเนื้อหาและคลังคำ"
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
