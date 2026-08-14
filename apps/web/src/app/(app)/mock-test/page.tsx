"use client";

// 📝 ข้อสอบเสมือนจริง (Mock Test) — HSK 1 และ HSK 2 ใช้หน้าเดียวกัน ต่างแค่ ?level=
//   /mock-test           → HSK 1
//   /mock-test?level=hsk2 → HSK 2
//
// บทบาทตามมติอาจารย์: เป็นตัว "confirm" ภาพรวมข้ามทั้ง 5 หมวด เทียบกับคะแนนก่อนเรียน
//
// ⚠️ เดโม: โจทย์ใช้ชุดตัวอย่างเดียวกับ pre-test (8 ข้อ) ส่วนหัวข้อบอก 20 ข้อ/25 นาที ตามโครงจริงที่ยังไม่ได้ออกแบบ

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Pinyin } from "@/components/Pinyin";
import { ProgressBar } from "@/components/ProgressBar";
import { Center } from "@/components/Feedback";
import { CATEGORIES } from "@/data/categories";
import { getLevel, type LevelId } from "@/data/levels";
import { speakZh, onVoicesReady } from "@/lib/speak";
import {
  PRETEST_QUESTIONS, MOCK_TEST_META, gradePretest, saveMockTest, skillLabel, SKILLS,
} from "@/data/mockData";

const SKILL_ICON = { vocab: "cards", listening: "headphone", reading: "book", sentence: "puzzle" } as const;

function MockTestInner({ levelId }: { levelId: LevelId }) {
  const router = useRouter();
  const level = getLevel(levelId);

  const [started, setStarted] = useState(false);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>(() => PRETEST_QUESTIONS.map(() => null));
  const [left, setLeft] = useState(MOCK_TEST_META.minutes * 60);
  const [voiceReady, setVoiceReady] = useState(true);

  useEffect(() => onVoicesReady(setVoiceReady), []);

  const finish = useCallback(
    (answers: (number | null)[]) => {
      saveMockTest(gradePretest(answers));
      router.push(`/mock-test/result?level=${levelId}`);
    },
    [router, levelId]
  );

  // นาฬิกาถอยหลังเหมือนสนามสอบจริง — หมดเวลาแล้วส่งอัตโนมัติ
  useEffect(() => {
    if (!started) return;
    const t = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          window.clearInterval(t);
          finish(picked);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [started, picked, finish]);

  const q = PRETEST_QUESTIONS[qi];

  const play = useCallback(() => {
    if (q?.skill === "listening" && !speakZh(q.choices[q.answer])) setVoiceReady(false);
  }, [q]);

  useEffect(() => {
    if (started) queueMicrotask(play);
  }, [started, qi, play]);

  function choose(idx: number) {
    const next = [...picked];
    next[qi] = idx;
    setPicked(next);
    window.setTimeout(() => {
      if (qi + 1 >= PRETEST_QUESTIONS.length) finish(next);
      else setQi((i) => i + 1);
    }, 200);
  }

  // ---------- หน้าเริ่ม ----------
  if (!started) {
    return (
      <div className="flex flex-col gap-5 p-5">
        <header>
          <Link href="/journey" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
            <Icon name="arrowLeft" className="h-3.5 w-3.5" /> เส้นทาง
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-ocean-900">
            ข้อสอบเสมือนจริง {level.name}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">วัดภาพรวมข้ามทุกหมวด เหมือนลงสนามสอบจริง</p>
        </header>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-600 p-6 text-white shadow-lg shadow-ocean-900/20">
          <span aria-hidden="true" className="absolute left-7 top-5 h-1 w-1 rounded-full bg-white/50" />
          <span aria-hidden="true" className="absolute right-10 top-8 h-1.5 w-1.5 rounded-full bg-white/40" />
          <div className="relative flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-display)] text-3xl font-bold">{level.name}</span>
            <span className="font-[family-name:var(--font-sc)] text-lg text-ocean-100">{level.zh}</span>
          </div>
          <div className="relative mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-3 text-center">
              <div className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">{MOCK_TEST_META.totalQuestions}</div>
              <div className="text-[11px] text-ocean-100">ข้อ</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center">
              <div className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">{MOCK_TEST_META.minutes}</div>
              <div className="text-[11px] text-ocean-100">นาที</div>
            </div>
          </div>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">ครอบทักษะอะไรบ้าง</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {SKILLS.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                <Icon name={s.icon} className="h-4 w-4 shrink-0 text-ocean-500" />
                <span className="text-sm text-slate-700">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">ครอบเนื้อหาทั้ง {CATEGORIES.length} หมวด</h2>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <span key={c.id} className="rounded-lg bg-ocean-50 px-2.5 py-1 text-xs text-ocean-700">{c.name}</span>
            ))}
          </div>
        </section>

        <div className="rounded-2xl bg-ocean-50 p-4 text-xs leading-relaxed text-slate-600">
          ตรวจตามเฉลยแบบเดียวกับข้อสอบจริง ไม่ใช้ AI เดา · ทำแล้วจะได้ตัวเลข “ความพร้อมสอบ” แยกรายทักษะ
          ไว้เทียบกับคะแนนก่อนเรียนของคุณ
        </div>

        <button
          onClick={() => setStarted(true)}
          className="w-full rounded-xl bg-ocean-900 px-5 py-4 font-semibold text-white shadow transition hover:bg-ocean-800 active:scale-[0.98]"
        >
          เริ่มทำข้อสอบ
        </button>

        <p className="text-center text-[11px] leading-relaxed text-slate-400">
          เดโม: ชุดนี้แสดงจริง {PRETEST_QUESTIONS.length} ข้อ · ชุดเต็ม {MOCK_TEST_META.totalQuestions} ข้อรอออกแบบพร้อมชุด pre-test
        </p>
      </div>
    );
  }

  // ---------- กำลังสอบ ----------
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const low = left < 60;

  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-ocean-50 px-2 py-0.5 text-xs font-medium text-ocean-700">
            <Icon name={SKILL_ICON[q.skill]} className="h-3.5 w-3.5" />
            {skillLabel(q.skill)}
          </span>
          <span className="flex items-center gap-3">
            <span className="tabular-nums text-slate-500">ข้อ {qi + 1}/{PRETEST_QUESTIONS.length}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold tabular-nums ${
                low ? "bg-coral-soft text-coral" : "bg-slate-100 text-slate-600"
              }`}
            >
              <Icon name="clock" className="h-3.5 w-3.5" /> {mm}:{ss}
            </span>
          </span>
        </div>
        <ProgressBar className="mt-2" size="lg" value={qi} max={PRETEST_QUESTIONS.length} label="ความคืบหน้าข้อสอบ" />
      </div>

      <div className="flex min-h-[32vh] flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        {q.skill === "listening" ? (
          <>
            <button
              onClick={play}
              aria-label="ฟังเสียงอีกครั้ง"
              className="grid h-24 w-24 place-items-center rounded-full bg-ocean-800 text-white shadow-lg shadow-ocean-900/30 transition hover:bg-ocean-900 active:scale-95"
            >
              <Icon name="speaker" className="h-10 w-10" />
            </button>
            <div className="mt-3 text-sm text-slate-500">{q.prompt}</div>
            {!voiceReady && <p className="mt-2 text-xs text-coral">เครื่องนี้ไม่มีเสียงภาษาจีนติดตั้ง</p>}
          </>
        ) : (
          <>
            {q.hanzi && <div className="font-[family-name:var(--font-sc)] text-5xl font-bold text-slate-900">{q.hanzi}</div>}
            {q.pinyin && <Pinyin text={q.pinyin} className="mt-3 text-xl font-medium" />}
            <div className="mt-4 text-sm text-slate-500">{q.prompt}</div>
          </>
        )}
      </div>

      <div className="grid gap-3">
        {q.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => choose(i)}
            className={`rounded-2xl border px-4 py-4 text-left transition active:scale-[0.99] ${
              picked[qi] === i
                ? "border-ocean-500 bg-ocean-50 text-ocean-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-ocean-300"
            }`}
          >
            <span className={q.choicesAreChinese ? "font-[family-name:var(--font-sc)] text-xl font-semibold" : "text-base"}>
              {c}
            </span>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400">โหมดสอบ — ไม่เฉลยระหว่างทำ ดูผลทั้งหมดตอนจบ</p>
    </div>
  );
}

export default function MockTest() {
  return (
    <Suspense fallback={<Center>กำลังเตรียมข้อสอบ...</Center>}>
      <MockTestFromQuery />
    </Suspense>
  );
}

function MockTestFromQuery() {
  const sp = useSearchParams();
  const levelId: LevelId = sp.get("level") === "hsk2" ? "hsk2" : "hsk1";
  return <MockTestInner key={levelId} levelId={levelId} />;
}
