"use client";

// ⭐ แบบทดสอบก่อนเรียน (pre-test) — ทุกคนทำตอนเข้าครั้งแรก (มติอาจารย์นัดรอบ 3 · PL-08)
// หน้าที่ของหน้านี้: เก็บ "คะแนนฐาน" แยกรายทักษะ ไว้เทียบกับคะแนนตอนเรียนไปแล้ว → เห็นว่าพัฒนาขึ้นไหม
//
// ⚠️ เดโม: ข้อสอบชุดนี้เป็นชุดตัวอย่าง 8 ข้อใน mockData.ts (ของจริงรอออกแบบพร้อม PL-04/PL-05)
//    แต่ "ตรวจจากเฉลยจริง" ไม่ได้สุ่มคะแนน — ตอบยังไงได้คะแนนตามนั้น

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Pinyin } from "@/components/Pinyin";
import { ProgressBar } from "@/components/ProgressBar";
import { Mascot, MascotSays } from "@/components/Mascot";
import { SkillBars, SkillVerdict, ScoreRing } from "@/components/SkillPanel";
import { CATEGORIES } from "@/data/categories";
import { speakZh, onVoicesReady } from "@/lib/speak";
import {
  PRETEST_QUESTIONS, gradePretest, savePretest, loadPretest,
  overall, weakest, skillLabel, type PretestResult,
} from "@/data/mockData";

type Stage = "intro" | "run" | "result";

export default function PreTest() {
  const [stage, setStage] = useState<Stage>("intro");
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>(() => PRETEST_QUESTIONS.map(() => null));
  const [result, setResult] = useState<PretestResult | null>(null);
  const [voiceReady, setVoiceReady] = useState(true);

  // เคยทำแล้ว → เข้ามาหน้านี้อีกครั้งให้เห็นผลเดิมเลย ไม่ต้องทำซ้ำ
  useEffect(() => {
    queueMicrotask(() => {
      const prev = loadPretest();
      if (prev) {
        setResult(prev);
        setStage("result");
      }
    });
  }, []);

  useEffect(() => onVoicesReady(setVoiceReady), []);

  const q = PRETEST_QUESTIONS[qi];

  const play = useCallback(() => {
    if (q?.skill === "listening") {
      const ok = speakZh(q.choices[q.answer]);
      if (!ok) setVoiceReady(false);
    }
  }, [q]);

  // ข้อฟัง: เล่นเสียงอัตโนมัติเมื่อเข้าข้อ
  useEffect(() => {
    if (stage === "run") queueMicrotask(play);
  }, [stage, qi, play]);

  function choose(idx: number) {
    const next = [...picked];
    next[qi] = idx;
    setPicked(next);

    window.setTimeout(() => {
      if (qi + 1 >= PRETEST_QUESTIONS.length) {
        const r = gradePretest(next);
        savePretest(r);
        setResult(r);
        setStage("result");
      } else {
        setQi((i) => i + 1);
      }
    }, 200);
  }

  // ---------- ① หน้าเริ่ม ----------
  if (stage === "intro") {
    return (
      <div className="flex flex-col gap-5 p-5">
        <header className="pt-2 text-center">
          <Mascot className="mx-auto h-16 w-16" />
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-ocean-900">ก่อนออกเดินทาง</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            มาดูกันว่าตอนนี้คุณมีพื้นฐานภาษาจีนแค่ไหน
          </p>
        </header>

        <div className="rounded-3xl border border-star/40 bg-star-soft p-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-star-ink">
            <Icon name="star" className="h-4 w-4" fill="currentColor" strokeWidth={0} />
            ทำครั้งเดียว ใช้เป็นจุดเริ่มต้นของคุณ
          </div>
          <p className="mt-2 text-sm leading-relaxed text-star-ink/90">
            ผลที่ได้จะกลายเป็น “คะแนนก่อนเรียน” เอาไว้เทียบตอนคุณเรียนไปสักพัก
            จะได้เห็นชัด ๆ ว่าพัฒนาขึ้นตรงไหน — ตอบไม่ได้ไม่เป็นไรเลย นั่นแหละคือจุดที่เราจะเริ่มกัน
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Fact icon="target" value={String(PRETEST_QUESTIONS.length)} unit="ข้อ" label="ครอบ 4 ทักษะ" />
          <Fact icon="clock" value="~3" unit="นาที" label="ไม่มีจับเวลา" />
        </div>

        <p className="rounded-2xl bg-ocean-50 p-4 text-center text-xs leading-relaxed text-slate-500">
          วัดคำศัพท์ · การฟัง · การอ่าน · ประโยค — อย่างละ 2 ข้อ
        </p>

        <button
          onClick={() => setStage("run")}
          className="w-full rounded-xl bg-ocean-900 px-5 py-4 font-semibold text-white shadow transition hover:bg-ocean-800 active:scale-[0.98]"
        >
          เริ่มทำแบบทดสอบ
        </button>
        <Link href="/" className="text-center text-sm text-slate-400 underline underline-offset-2 hover:text-slate-600">
          ขอข้ามไปก่อน
        </Link>
      </div>
    );
  }

  // ---------- ③ หน้าผล ----------
  if (stage === "result" && result) {
    const pct = overall(result.skills);
    const weak = weakest(result.skills);
    const lowStart = pct < 40;
    const startContent = CATEGORIES[0];

    return (
      <div className="flex flex-col gap-5 p-5">
        <header className="pt-1 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-ocean-900">ผลการประเมินของคุณ</h1>
          <p className="mt-0.5 text-sm text-slate-500">ตอบถูก {result.correct} จาก {result.total} ข้อ</p>
        </header>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <ScoreRing pct={pct} label="พื้นฐานตอนนี้" />
          <div className="mt-4">
            <SkillBars scores={result.skills} />
          </div>
        </div>

        {/* เส้นทางที่แนะนำ — ต่ำมากให้เริ่มพื้นฐานเสียง ไม่งั้นเลือกหมวดได้เลย */}
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
            <Icon name="compass" className="h-4 w-4" />
            เส้นทางที่แนะนำ
          </h2>

          <div className="rounded-3xl border border-star/40 bg-star-soft p-5">
            <MascotSays mascotClassName="h-11 w-11">
              {lowStart
                ? "เริ่มจากพื้นฐานเสียงก่อนดีกว่า อ่านพินอินออกแล้วที่เหลือจะง่ายขึ้นเยอะเลย ⭐"
                : `พื้นฐานใช้ได้เลย! ข้ามพื้นฐานเสียงไปเริ่มที่หมวดแรกได้ ระหว่างทางเราจะเน้น${skillLabel(weak)}ให้ ⭐`}
            </MascotSays>

            <Link
              href={lowStart ? "/foundation" : `/learn/category?cat=${startContent.id}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-900 px-5 py-3.5 font-semibold text-white shadow transition hover:bg-ocean-800 active:scale-[0.98]"
            >
              {lowStart ? "เริ่มที่พื้นฐานเสียง" : `เริ่มที่หมวด 1 · ${startContent.name}`}
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>

            <Link
              href={lowStart ? `/learn/category?cat=${startContent.id}` : "/foundation"}
              className="mt-2 block text-center text-xs text-star-ink underline underline-offset-2"
            >
              {lowStart ? "ข้ามพื้นฐาน ไปเริ่มหมวด 1 เลย" : "อยากทบทวนพื้นฐานเสียงก่อนก็ได้"}
            </Link>
          </div>
        </section>

        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <SkillVerdict scores={result.skills} />
        </div>

        <Link href="/" className="text-center text-sm text-ocean-600 underline underline-offset-2">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  // ---------- ② กำลังทำข้อสอบ ----------
  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-ocean-50 px-2 py-0.5 text-xs font-medium text-ocean-700">
            <Icon name={SKILL_ICON[q.skill]} className="h-3.5 w-3.5" />
            {skillLabel(q.skill)}
          </span>
          <span className="tabular-nums">ข้อ {qi + 1}/{PRETEST_QUESTIONS.length}</span>
        </div>
        <ProgressBar className="mt-2" size="lg" value={qi} max={PRETEST_QUESTIONS.length} label="ความคืบหน้าแบบทดสอบ" />
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
            {!voiceReady && (
              <p className="mt-2 max-w-[26ch] text-xs leading-relaxed text-coral">
                เครื่องนี้ยังไม่มีเสียงภาษาจีนติดตั้ง — ข้อฟังในเดโมเลยไม่มีเสียง
              </p>
            )}
          </>
        ) : (
          <>
            {q.hanzi && (
              <div className="font-[family-name:var(--font-sc)] text-5xl font-bold text-slate-900">{q.hanzi}</div>
            )}
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

      <p className="text-center text-xs text-slate-400">ไม่มีเฉลยระหว่างทำ — ดูผลรวมทีเดียวตอนจบ</p>
    </div>
  );
}

const SKILL_ICON = { vocab: "cards", listening: "headphone", reading: "book", sentence: "puzzle" } as const;

function Fact({ icon, value, unit, label }: { icon: "target" | "clock"; value: string; unit: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
      <Icon name={icon} className="mx-auto h-5 w-5 text-ocean-500" />
      <div className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-bold leading-none text-ocean-900">
        {value}
        <span className="ml-1 text-xs font-normal text-slate-400">{unit}</span>
      </div>
      <div className="mt-1 text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
