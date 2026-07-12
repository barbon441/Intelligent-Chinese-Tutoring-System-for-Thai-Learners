"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, audioUrl, type Word } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Flashcards() {
  const [words, setWords] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <main className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-sky-50 to-pink-50 p-6 text-slate-800">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>บัตรคำ HSK 1</span>
          <span>ตรวจแล้ว {reviewedCount}/{words.length}</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-pink-400" style={{ width: `${(reviewedCount / words.length) * 100}%` }} />
        </div>
      </div>

      {/* บัตรคำ — คลิกเพื่อพลิก */}
      <button
        onClick={() => setFlipped((f) => !f)}
        className="flex aspect-[3/2] w-full max-w-md flex-col items-center justify-center rounded-3xl bg-white shadow-xl transition active:scale-[0.99]"
      >
        {!flipped ? (
          <>
            <div className="text-7xl font-bold">{word.hanzi}</div>
            <div className="mt-3 text-2xl text-slate-500">{word.pinyin}</div>
            <div className="mt-6 text-xs text-slate-400">แตะเพื่อดูคำแปล</div>
          </>
        ) : (
          <>
            <div className="text-4xl font-semibold text-pink-600">{word.meaning_th || "—"}</div>
            <div className="mt-3 text-sm text-slate-400">{(word.meaning_en ?? []).slice(0, 2).join("; ")}</div>
            <div className="mt-2 text-2xl text-slate-500">{word.hanzi} · {word.pinyin}</div>
          </>
        )}
      </button>

      {/* ปุ่มเสียง + เลื่อน */}
      <div className="flex w-full max-w-md items-center justify-between">
        <button onClick={() => go(-1)} disabled={idx === 0}
          className="rounded-xl bg-white px-5 py-3 shadow disabled:opacity-40">← ก่อนหน้า</button>
        <button onClick={play}
          className="rounded-full bg-sky-700 px-6 py-3 text-white shadow hover:bg-sky-800">🔊 ฟัง</button>
        <button onClick={() => go(1)} disabled={idx === words.length - 1}
          className="rounded-xl bg-white px-5 py-3 shadow disabled:opacity-40">ถัดไป →</button>
      </div>
      <div className="text-sm text-slate-400">{idx + 1} / {words.length}</div>

      {/* โหมดตรวจ (สำหรับหฤทัย) */}
      <div className="mt-2 w-full max-w-md rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4">
        <div className="text-sm font-medium text-slate-600">
          ตรวจคำแปล {word.th_reviewed ? "✅ ตรวจแล้ว" : "⏳ ยังไม่ตรวจ"}
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={() => saveReview(word.meaning_th)}
            className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700">
            ✓ คำแปลถูก
          </button>
          <button
            onClick={() => {
              const v = prompt("แก้คำแปลไทย:", word.meaning_th);
              if (v !== null && v.trim()) saveReview(v.trim());
            }}
            className="flex-1 rounded-xl bg-amber-500 px-3 py-2 text-sm text-white hover:bg-amber-600">
            ✏️ แก้คำแปล
          </button>
        </div>
      </div>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center text-slate-600">{children}</main>;
}
