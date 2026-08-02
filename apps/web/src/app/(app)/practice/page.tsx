"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase, audioUrl, type Word } from "@/lib/supabase";
import { catName } from "@/data/categories";
import { saveRound, type QuizMode } from "@/lib/progress";
import { SENTENCES } from "@/data/sentences";
import SentenceOrder from "./SentenceOrder";
import { Icon, type IconName } from "@/components/Icon";
import { Pinyin } from "@/components/Pinyin";

const N_QUESTIONS = 10;

type Choice = { id: number; label: string };
type Question = { word: Word; choices: Choice[] };

export default function Practice() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<QuizMode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    // อ่านหมวดจาก ?cat=1-5 (มาจากหน้าเลือกหมวด) — ไม่มี = ฝึกจากทั้ง 300 คำแบบเดิม
    const c = Number(new URLSearchParams(window.location.search).get("cat")) || null;
    setCat(c);
    (async () => {
      let q = supabase
        .from("words")
        .select("id, hanzi, pinyin, meaning_th, meaning_en, th_reviewed, audio_path, hsk_level, category")
        .eq("hsk_level", 1);
      if (c) q = q.eq("category", c);
      const { data, error } = await q.order("id");
      if (error) setError(error.message);
      else setWords(data as Word[]);
      setLoading(false);
    })();
  }, []);

  // คำที่ใช้ได้ในแต่ละโหมด (อ่าน = ต้องมีคำแปล · ฟัง = ต้องมีเสียง)
  const pools = useMemo(() => {
    const withMeaning = words.filter((w) => w.meaning_th && w.meaning_th.trim());
    return {
      read: withMeaning,
      listen: withMeaning.filter((w) => w.audio_path),
    };
  }, [words]);

  const start = useCallback(
    (m: "read" | "listen") => {
      const pool = pools[m];
      setMode(m);
      setQuestions(buildQuiz(pool, m, N_QUESTIONS));
      setQi(0);
      setPicked(null);
      setCorrectCount(0);
      setDone(false);
      savedRef.current = false;
    },
    [pools]
  );

  const q = questions[qi];

  // เล่นเสียงอัตโนมัติในโหมดฟัง
  const play = useCallback(() => {
    if (mode === "listen" && q?.word.audio_path) {
      new Audio(audioUrl(q.word.audio_path)).play().catch(() => {});
    }
  }, [mode, q]);
  useEffect(() => {
    if (!done) play();
  }, [qi, done, play]);

  function choose(id: number) {
    if (picked !== null) return; // ตอบแล้ว ล็อกไว้
    setPicked(id);
    if (id === q.word.id) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (qi + 1 >= questions.length) {
      setDone(true);
      if (!savedRef.current && mode) {
        saveRound({ ts: Date.now(), mode, total: questions.length, correct: correctCount });
        savedRef.current = true;
      }
    } else {
      setQi((i) => i + 1);
      setPicked(null);
    }
  }

  if (loading) return <Center>กำลังโหลดคลังคำ...</Center>;
  if (error) return <Center>❌ {error}</Center>;

  // ---------- โหมดเรียงประโยค (ใช้คนละ engine กับ MCQ) ----------
  if (mode === "order") return <SentenceOrder onExit={() => setMode(null)} />;

  // ---------- หน้าเลือกโหมด ----------
  if (!mode) {
    return (
      <div className="flex flex-col gap-5 p-5">
        <header>
          <h1 className="text-xl font-semibold text-slate-700">
            ฝึกทำข้อสอบ{cat ? ` · ${catName(cat) ?? `หมวด ${cat}`}` : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            รูปแบบข้อสอบ HSK · เลือกคำตอบที่ถูก · ตรวจให้ทันที {N_QUESTIONS} ข้อ/รอบ
            {cat ? " · เฉพาะคำในหมวดนี้" : ""}
          </p>
        </header>

        <ModeCard
          icon="book"
          title="ฝึกการอ่าน"
          desc="เห็นตัวอักษรจีน + พินอิน → เลือกคำแปลไทยที่ถูก"
          count={pools.read.length}
          onStart={() => start("read")}
        />
        <ModeCard
          icon="headphone"
          title="ฝึกการฟัง"
          desc="ฟังเสียงอ่าน → เลือกตัวอักษรจีนที่ถูก"
          count={pools.listen.length}
          onStart={() => start("listen")}
        />
        <ModeCard
          icon="puzzle"
          title="เรียงประโยค"
          desc="แตะคำมาเรียงให้เป็นประโยคที่ถูก (ดักจุดผิดลำดับคำแบบคนไทย)"
          count={SENTENCES.length}
          unit="ประโยค"
          onStart={() => setMode("order")}
        />

        <div className="flex gap-2 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
          <Icon name="bulb" className="mt-0.5 h-4 w-4 shrink-0 text-xp" />
          <p>
            ข้อสอบสุ่มจากคลังคำ HSK 1 ที่เรามี ตรวจด้วยกติกา (rule-based) ไม่ใช้ AI เดา —
            ตรงกับรูปแบบการวัดผลจริงของ HSK · ผลการฝึกจะไปแสดงในหน้า{" "}
            <Link href="/progress" className="text-ink-500 underline">
              ผล
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ---------- หน้าสรุปผล ----------
  if (done) {
    const pct = Math.round((correctCount / questions.length) * 100);
    const pass = pct >= 60;
    return (
      <div className="flex flex-col items-center gap-6 p-5">
        <div className={`mt-6 grid h-20 w-20 place-items-center rounded-full ${pass ? "bg-seal-soft text-seal" : "bg-ink-50 text-ink-500"}`}>
          <Icon name={pass ? "sparkles" : "target"} className="h-10 w-10" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-700">
          {pass ? "เยี่ยมมาก!" : "สู้ ๆ ทวนอีกนิด!"}
        </h1>
        <div className="w-full rounded-3xl bg-gradient-to-br from-ink-900 via-ink-700 to-ink-500 p-6 text-center text-white shadow-lg">
          <div className="font-[family-name:var(--font-display)] text-5xl font-extrabold">
            {correctCount}
            <span className="text-2xl font-normal text-ink-100"> / {questions.length}</span>
          </div>
          <div className="mt-1 text-ink-100">ความแม่นยำ {pct}%</div>
        </div>
        <div className="flex w-full gap-3">
          <button
            onClick={() => start(mode)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink-700 px-4 py-3 font-semibold text-white shadow transition hover:bg-ink-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-300 focus-visible:ring-offset-2"
          >
            <Icon name="refresh" className="h-5 w-5" /> ฝึกอีกรอบ
          </button>
          <button
            onClick={() => setMode(null)}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            เปลี่ยนโหมด
          </button>
        </div>
        <Link href="/progress" className="text-sm text-sky-600 underline">
          ดูสรุปผลการฝึกทั้งหมด →
        </Link>
      </div>
    );
  }

  // ---------- หน้าทำข้อสอบ ----------
  const answered = picked !== null;
  return (
    <div className="flex flex-col gap-5 p-5">
      {/* แถบความคืบหน้า */}
      <div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <button onClick={() => setMode(null)} className="text-slate-400">
            ← ออก
          </button>
          <span>
            ข้อ {qi + 1}/{questions.length} · ถูก {correctCount}
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-sky-500 transition-all"
            style={{ width: `${(qi / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* โจทย์ */}
      <div className="flex min-h-[38vh] flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        {mode === "read" ? (
          <>
            <div className="text-7xl font-bold text-slate-900">{q.word.hanzi}</div>
            <Pinyin text={q.word.pinyin} className="mt-3 text-2xl font-medium" />
          </>
        ) : (
          <>
            <button
              onClick={play}
              aria-label="ฟังเสียง"
              className="grid h-24 w-24 place-items-center rounded-full bg-ink-700 text-white shadow-lg shadow-ink-900/30 transition hover:bg-ink-900 active:scale-95"
            >
              <Icon name="speaker" className="h-10 w-10" />
            </button>
            <div className="mt-3 text-sm text-slate-400">
              {answered ? <Pinyin text={q.word.pinyin} /> : "แตะเพื่อฟังอีกครั้ง"}
            </div>
          </>
        )}
      </div>

      {/* ตัวเลือก */}
      <div className="grid grid-cols-1 gap-3">
        {q.choices.map((c) => {
          const isCorrect = c.id === q.word.id;
          const isPicked = c.id === picked;
          let cls = "border-slate-200 bg-white text-slate-700 hover:border-sky-300";
          if (answered) {
            if (isCorrect) cls = "border-emerald-400 bg-emerald-50 text-emerald-800";
            else if (isPicked) cls = "border-rose-300 bg-rose-50 text-rose-700";
            else cls = "border-slate-100 bg-slate-50 text-slate-400";
          }
          return (
            <button
              key={c.id}
              onClick={() => choose(c.id)}
              disabled={answered}
              className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${cls}`}
            >
              <span className={mode === "listen" ? "text-2xl font-semibold" : "text-base"}>
                {c.label}
              </span>
              {answered && isCorrect && <Icon name="check" className="h-5 w-5 text-correct" strokeWidth={2.4} />}
              {answered && isPicked && !isCorrect && <Icon name="x" className="h-5 w-5 text-seal" strokeWidth={2.4} />}
            </button>
          );
        })}
      </div>

      {/* ปุ่มถัดไป */}
      {answered && (
        <button
          onClick={next}
          className="rounded-xl bg-sky-700 px-4 py-3 text-white shadow hover:bg-sky-800"
        >
          {qi + 1 >= questions.length ? "ดูผล →" : "ข้อถัดไป →"}
        </button>
      )}
    </div>
  );
}

// ---------- สร้างชุดข้อสอบจากคลังคำ ----------
function buildQuiz(pool: Word[], mode: QuizMode, n: number): Question[] {
  if (pool.length < 4) return [];
  const targets = shuffle(pool).slice(0, Math.min(n, pool.length));
  const labelOf = (w: Word) => (mode === "read" ? w.meaning_th : w.hanzi);

  return targets.map((word) => {
    const correctLabel = labelOf(word);
    const distractors: Word[] = [];
    const usedLabels = new Set([correctLabel]);
    for (const w of shuffle(pool)) {
      if (distractors.length >= 3) break;
      if (w.id === word.id) continue;
      const lb = labelOf(w);
      if (usedLabels.has(lb)) continue; // กันตัวเลือกซ้ำความหมาย
      usedLabels.add(lb);
      distractors.push(w);
    }
    const choices: Choice[] = shuffle([
      { id: word.id, label: correctLabel },
      ...distractors.map((w) => ({ id: w.id, label: labelOf(w) })),
    ]);
    return { word, choices };
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ModeCard({
  icon,
  title,
  desc,
  count,
  onStart,
  unit = "คำ",
}: {
  icon: IconName;
  title: string;
  desc: string;
  count: number;
  onStart: () => void;
  unit?: string;
}) {
  const enough = count >= 4;
  return (
    <button
      onClick={onStart}
      disabled={!enough}
      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:shadow disabled:opacity-50"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-50">
        <Icon name={icon} className="h-6 w-6 text-ink-700" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-slate-700">{title}</div>
        <div className="text-xs text-slate-400">{desc}</div>
        <div className="mt-1 text-[11px] text-slate-400">
          {enough ? `คลังพร้อม ${count} ${unit}` : `${unit}ในคลังยังไม่พอ`}
        </div>
      </div>
      <Icon name="play" className="h-4 w-4 text-ink-300" />
    </button>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-slate-600">{children}</div>
  );
}
