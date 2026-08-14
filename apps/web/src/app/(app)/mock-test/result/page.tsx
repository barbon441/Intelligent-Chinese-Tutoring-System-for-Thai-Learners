"use client";

// ⭐ ความพร้อมสอบ (Readiness) — หน้าผลหลังทำข้อสอบเสมือนจริง
// ใช้หน้าเดียวกันทั้ง HSK 1 และ HSK 2 (?level=)
//
// จุดที่อาจารย์ย้ำและหน้านี้ต้องตอบให้ได้:
//   ① ห้ามโชว์แค่คะแนนรวม — ต้องเห็นรายทักษะ
//   ② ต้องเทียบ "ก่อนเรียน → ตอนนี้" ให้เห็นว่าพัฒนาขึ้นไหม
//   ③ ต้องบอกว่าไปต่อยังไง
//
// ⚠️ เดโม: ถ้ายังไม่เคยทำข้อสอบ หน้านี้จะโชว์ตัวเลขสมมติจาก mockData เพื่อให้เห็นหน้าตา

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Center } from "@/components/Feedback";
import { Mascot } from "@/components/Mascot";
import { SkillBars, SkillVerdict, SkillDelta, ScoreRing } from "@/components/SkillPanel";
import { getLevel, type LevelId } from "@/data/levels";
import {
  READINESS, loadMockTest, loadPretest, overall, weakest, skillLabel, type SkillScores,
} from "@/data/mockData";

const PRACTICE_HREF: Record<string, string> = {
  vocab: "/flashcards",
  listening: "/practice?mode=listen",
  reading: "/practice?mode=read",
  sentence: "/practice?mode=order",
};

function ResultInner({ levelId }: { levelId: LevelId }) {
  const level = getLevel(levelId);
  const [scores, setScores] = useState<SkillScores>(READINESS);
  const [before, setBefore] = useState<SkillScores | null>(null);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      const mt = loadMockTest();
      if (mt) {
        setScores(mt.skills);
        setIsMock(false);
      }
      const pre = loadPretest();
      if (pre) setBefore(pre.skills);
    });
  }, []);

  const pct = overall(scores);
  const weak = weakest(scores);
  const ready = pct >= 70;

  return (
    <div className="flex flex-col gap-5 p-5">
      <header className="pt-1 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-star-soft px-3 py-1 text-xs font-bold text-star-ink">
          <Icon name="star" className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
          ความพร้อมสอบ {level.name}
        </div>
      </header>

      {/* ① คะแนนรวม */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <ScoreRing pct={pct} label="ความพร้อม" />
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
          {ready ? "คุณเข้าใกล้เป้าหมายแล้ว" : "ยังมีที่ให้เก็บอีกนิด — เดินต่อได้เลย"}
        </p>
        <div className="mt-4">
          <SkillBars scores={scores} />
        </div>
      </div>

      {/* ② เทียบก่อนเรียน → ตอนนี้ */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
          <Icon name="chart" className="h-4 w-4" />
          เทียบกับก่อนเรียน
        </h2>
        {before ? (
          <>
            <SkillDelta before={before} after={scores} />
            <div className="mt-2.5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <Mascot className="h-11 w-11 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ocean-900">
                  ภาพรวมขยับ {overall(before)}% → {pct}%
                  <span className={`ml-1.5 ${pct - overall(before) >= 0 ? "text-correct" : "text-coral"}`}>
                    ({pct - overall(before) >= 0 ? "+" : ""}{pct - overall(before)})
                  </span>
                </div>
                <div className="text-xs leading-snug text-slate-600">
                  ตัวเลขนี้คือเหตุผลที่เราให้ทำแบบทดสอบก่อนเรียน — ไม่มีคะแนนตั้งต้น ก็บอกไม่ได้ว่าดีขึ้นเท่าไหร่
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
            <p className="text-sm text-slate-500">ยังไม่มีคะแนนก่อนเรียนไว้เทียบ</p>
            <Link
              href="/pretest"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-ocean-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-800"
            >
              ทำแบบทดสอบก่อนเรียน <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ③ ไปต่อยังไง */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
          <Icon name="compass" className="h-4 w-4" />
          เส้นทางถัดไป
        </h2>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <SkillVerdict scores={scores} actionHref={PRACTICE_HREF[weak]} />
        </div>
      </section>

      {/* ④ ประตูสู่ระดับถัดไป */}
      {levelId === "hsk1" && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-600 p-5 text-white shadow-lg shadow-ocean-900/20">
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-2 select-none font-[family-name:var(--font-sc)] text-[7rem] leading-none text-white/[0.07]">二级</span>
          <div className="relative">
            <div className="flex items-center gap-2">
              <Icon name="ship" className="h-5 w-5 text-star" />
              <span className="font-semibold">พร้อมเดินทางต่อสู่ HSK 2 หรือยัง?</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ocean-100">
              {ready
                ? `ความพร้อม ${pct}% — ผ่านเกณฑ์ที่เราตั้งไว้แล้ว ลองเปิดเส้นทาง HSK 2 ดูได้`
                : `ตอนนี้ ${pct}% แนะนำเก็บ${skillLabel(weak)}ให้แน่นก่อน แล้วค่อยข้ามไป HSK 2`}
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/mock-test?level=hsk2"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-ocean-900 shadow transition active:scale-[0.98]"
              >
                ลองข้อสอบ HSK 2 <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link
                href="/journey"
                className="flex flex-1 items-center justify-center rounded-xl border border-white/40 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                ดูเส้นทาง
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="flex gap-2">
        <Link
          href={`/mock-test?level=${levelId}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
        >
          <Icon name="refresh" className="h-4 w-4" /> สอบใหม่
        </Link>
        <Link
          href="/"
          className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          กลับหน้าแรก
        </Link>
      </div>

      {isMock && (
        <p className="pb-2 text-center text-[11px] leading-relaxed text-slate-400">
          ตัวเลขชุดนี้เป็นค่าสมมติเพื่อให้เห็นหน้าตา — ลองทำข้อสอบแล้วตัวเลขจะเปลี่ยนตามที่ตอบจริง
        </p>
      )}
    </div>
  );
}

export default function MockTestResult() {
  return (
    <Suspense fallback={<Center>กำลังรวมคะแนน...</Center>}>
      <ResultFromQuery />
    </Suspense>
  );
}

function ResultFromQuery() {
  const sp = useSearchParams();
  const levelId: LevelId = sp.get("level") === "hsk2" ? "hsk2" : "hsk1";
  return <ResultInner key={levelId} levelId={levelId} />;
}
