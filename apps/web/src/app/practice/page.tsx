"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase, audioUrl, type Word } from "@/lib/supabase";
import { saveRound, type QuizMode } from "@/lib/progress";

const N_QUESTIONS = 10;

type Choice = { id: number; label: string };
type Question = { word: Word; choices: Choice[] };

export default function Practice() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<QuizMode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("words")
        .select("id, hanzi, pinyin, meaning_th, meaning_en, th_reviewed, audio_path, hsk_level")
        .eq("hsk_level", 1)
        .order("id");
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
    (m: QuizMode) => {
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

  // ---------- หน้าเลือกโหมด ----------
  if (!mode) {
    return (
      <div className="flex flex-col gap-5 p-5">
        <header>
          <h1 className="text-xl font-semibold text-slate-700">ฝึกทำข้อสอบ</h1>
          <p className="mt-1 text-sm text-slate-400">
            รูปแบบข้อสอบ HSK · เลือกคำตอบที่ถูก · ตรวจให้ทันที {N_QUESTIONS} ข้อ/รอบ
          </p>
        </header>

        <ModeCard
          icon="📖"
          title="ฝึกการอ่าน"
          desc="เห็นตัวอักษรจีน + พินอิน → เลือกคำแปลไทยที่ถูก"
          count={pools.read.length}
          onStart={() => start("read")}
        />
        <ModeCard
          icon="🎧"
          title="ฝึกการฟัง"
          desc="ฟังเสียงอ่าน → เลือกตัวอักษรจีนที่ถูก"
          count={pools.listen.length}
          onStart={() => start("listen")}
        />

        <p className="rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
          💡 ข้อสอบสุ่มจากคลังคำ HSK 1 ที่เรามี ตรวจด้วยกติกา (rule-based) ไม่ใช้ AI เดา —
          ตรงกับรูปแบบการวัดผลจริงของ HSK · ผลการฝึกจะไปแสดงในหน้า{" "}
          <Link href="/progress" className="text-sky-600 underline">
            ผล
          </Link>
        </p>
      </div>
    );
  }

  // ---------- หน้าสรุปผล ----------
  if (done) {
    const pct = Math.round((correctCount / questions.length) * 100);
    const pass = pct >= 60;
    return (
      <div className="flex flex-col items-center gap-6 p-5">
        <div className="mt-6 text-6xl">{pass ? "🎉" : "💪"}</div>
        <h1 className="text-xl font-semibold text-slate-700">
          {pass ? "เยี่ยมมาก!" : "สู้ ๆ ทวนอีกนิด!"}
        </h1>
        <div className="w-full rounded-3xl bg-gradient-to-br from-sky-600 to-sky-800 p-6 text-center text-white shadow-lg">
          <div className="text-5xl font-bold">
            {correctCount}
            <span className="text-2xl font-normal text-sky-200"> / {questions.length}</span>
          </div>
          <div className="mt-1 text-sky-100">ความแม่นยำ {pct}%</div>
        </div>
        <div className="flex w-full gap-3">
          <button
            onClick={() => start(mode)}
            className="flex-1 rounded-xl bg-sky-700 px-4 py-3 text-white shadow hover:bg-sky-800"
          >
            🔁 ฝึกอีกรอบ
          </button>
          <button
            onClick={() => setMode(null)}
            className="flex-1 rounded-xl bg-white px-4 py-3 text-slate-600 shadow hover:bg-slate-50"
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
            <div className="text-7xl font-bold">{q.word.hanzi}</div>
            <div className="mt-3 text-2xl text-slate-500">{q.word.pinyin}</div>
          </>
        ) : (
          <>
            <button
              onClick={play}
              className="grid h-24 w-24 place-items-center rounded-full bg-sky-700 text-4xl text-white shadow hover:bg-sky-800"
            >
              🔊
            </button>
            <div className="mt-3 text-sm text-slate-400">
              {answered ? `${q.word.pinyin}` : "แตะเพื่อฟังอีกครั้ง"}
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
              {answered && isCorrect && <span>✓</span>}
              {answered && isPicked && !isCorrect && <span>✗</span>}
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
}: {
  icon: string;
  title: string;
  desc: string;
  count: number;
  onStart: () => void;
}) {
  const enough = count >= 4;
  return (
    <button
      onClick={onStart}
      disabled={!enough}
      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:shadow disabled:opacity-50"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sky-50 text-2xl">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium text-slate-700">{title}</div>
        <div className="text-xs text-slate-400">{desc}</div>
        <div className="mt-1 text-[11px] text-slate-400">
          {enough ? `คลังพร้อม ${count} คำ` : "คำในคลังยังไม่พอ"}
        </div>
      </div>
      <span className="text-sky-400">▶</span>
    </button>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-slate-600">{children}</div>
  );
}
