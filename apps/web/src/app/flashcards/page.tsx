"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, audioUrl, type Word } from "@/lib/supabase";
import { Icon } from "@/components/Icon";
import { Pinyin } from "@/components/Pinyin";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Flashcards() {
  const [words, setWords] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState(false);

  // โหมดตรวจ (สำหรับหฤทัย) เปิดด้วย ?review=1 — ผู้เรียนทั่วไปเห็นบัตรคำสะอาด ๆ
  useEffect(() => {
    setReviewMode(new URLSearchParams(window.location.search).get("review") === "1");
  }, []);

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

  const word = words[idx];
  const reviewedCount = words.filter((w) => w.th_reviewed).length;

  const play = useCallback(() => {
    if (word?.audio_path) new Audio(audioUrl(word.audio_path)).play().catch(() => {});
  }, [word]);

  const go = useCallback(
    (delta: number) => {
      setFlipped(false);
      setIdx((i) => Math.min(Math.max(i + delta, 0), words.length - 1));
    },
    [words.length]
  );

  // เล่นเสียงอัตโนมัติเมื่อเปลี่ยนคำ
  useEffect(() => {
    if (word) play();
  }, [idx, word, play]);

  // ปุ่มลูกศร/สเปซ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") { e.preventDefault(); setFlipped((f) => !f); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  async function saveReview(meaning_th: string) {
    try {
      const res = await fetch(`${API_URL}/words/${word.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meaning_th, reviewed: true }),
      });
      if (!res.ok) throw new Error("save failed");
      setWords((ws) =>
        ws.map((w) => (w.id === word.id ? { ...w, meaning_th, th_reviewed: true } : w))
      );
    } catch {
      alert("บันทึกไม่ได้ — ตรวจว่า API (uvicorn) รันอยู่ที่ " + API_URL);
    }
  }

  if (loading) return <Center>กำลังโหลดคำศัพท์...</Center>;
  if (error) return <Center>❌ {error}</Center>;
  if (!word) return <Center>ไม่พบคำศัพท์</Center>;

  return (
    <div className="flex flex-col items-center gap-6 p-5">
      <div className="w-full">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>บัตรคำ HSK 1</span>
          <span>{reviewMode ? `ตรวจแล้ว ${reviewedCount}/${words.length}` : `${idx + 1}/${words.length}`}</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-pink-400"
            style={{ width: `${((reviewMode ? reviewedCount : idx + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* บัตรคำ — คลิกเพื่อพลิก */}
      <button
        onClick={() => setFlipped((f) => !f)}
        className="flex aspect-[3/2] w-full flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-xl transition active:scale-[0.99]"
      >
        {!flipped ? (
          <>
            <div className="text-8xl font-bold text-slate-900">{word.hanzi}</div>
            <Pinyin text={word.pinyin} className="mt-4 text-2xl font-medium" />
            <div className="mt-6 text-xs text-slate-400">แตะเพื่อดูคำแปล</div>
          </>
        ) : (
          <>
            <div className="text-4xl font-semibold text-seal">{word.meaning_th || "—"}</div>
            <div className="mt-3 text-sm text-slate-400">{(word.meaning_en ?? []).slice(0, 2).join("; ")}</div>
            <div className="mt-2 flex items-center gap-2 text-2xl text-slate-500">
              <span className="font-[family-name:var(--font-sc)]">{word.hanzi}</span>
              <span>·</span>
              <Pinyin text={word.pinyin} className="font-medium" />
            </div>
          </>
        )}
      </button>

      {/* ปุ่มเสียง + เลื่อน */}
      <div className="flex w-full items-center justify-between gap-3">
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          aria-label="คำก่อนหน้า"
          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-5 py-3 font-medium text-slate-600 transition hover:bg-slate-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-40"
        >
          <Icon name="arrowLeft" className="h-4 w-4" /> ก่อนหน้า
        </button>
        <button
          onClick={play}
          aria-label="ฟังเสียงอ่าน"
          className="flex items-center gap-2 rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white shadow-lg shadow-ink-900/30 transition hover:bg-ink-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-300 focus-visible:ring-offset-2"
        >
          <Icon name="speaker" className="h-5 w-5" /> ฟัง
        </button>
        <button
          onClick={() => go(1)}
          disabled={idx === words.length - 1}
          aria-label="คำถัดไป"
          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-5 py-3 font-medium text-slate-600 transition hover:bg-slate-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-40"
        >
          ถัดไป <Icon name="arrowRight" className="h-4 w-4" />
        </button>
      </div>
      {reviewMode && <div className="text-sm text-slate-400">{idx + 1} / {words.length}</div>}

      {/* โหมดตรวจ (สำหรับหฤทัย) — เปิดด้วย ?review=1 เท่านั้น */}
      {reviewMode && (
        <div className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            ตรวจคำแปล
            {word.th_reviewed ? (
              <span className="inline-flex items-center gap-1 text-correct">
                <Icon name="check" className="h-4 w-4" strokeWidth={2.4} /> ตรวจแล้ว
              </span>
            ) : (
              <span className="text-slate-400">ยังไม่ตรวจ</span>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => saveReview(word.meaning_th)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white transition hover:bg-emerald-700 active:scale-95">
              <Icon name="check" className="h-4 w-4" strokeWidth={2.4} /> คำแปลถูก
            </button>
            <button
              onClick={() => {
                const v = prompt("แก้คำแปลไทย:", word.meaning_th);
                if (v !== null && v.trim()) saveReview(v.trim());
              }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-sm text-white transition hover:bg-amber-600 active:scale-95">
              <Icon name="pencil" className="h-4 w-4" /> แก้คำแปล
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[60vh] items-center justify-center text-slate-600">{children}</div>;
}
