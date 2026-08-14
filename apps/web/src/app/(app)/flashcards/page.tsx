"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, audioUrl, type Word } from "@/lib/supabase";
import { catName } from "@/data/categories";
import { Center, ErrorState } from "@/components/Feedback";
import { loadCards, review, Rating } from "@/lib/fsrs";
import { Icon } from "@/components/Icon";
import { Pinyin } from "@/components/Pinyin";
import { Mascot } from "@/components/Mascot";
import { ProgressBar } from "@/components/ProgressBar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function FlashcardsInner({ cat, reviewMode }: { cat: number | null; reviewMode: boolean }) {
  const [words, setWords] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const seenRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    seenRef.current = new Set(Object.keys(loadCards()).map(Number));
    (async () => {
      let q = supabase
        .from("words")
        .select("id, hanzi, pinyin, meaning_th, meaning_en, th_reviewed, audio_path, hsk_level, category")
        .eq("hsk_level", 1);
      if (cat) q = q.eq("category", cat);
      const { data, error } = await q.order("id");
      if (error) setError(error.message);
      else setWords(data as Word[]);
      setLoading(false);
    })();
  }, [cat]);

  const word = words[idx];
  const reviewedCount = words.filter((w) => w.th_reviewed).length;

  const play = useCallback(() => {
    if (word?.audio_path) new Audio(audioUrl(word.audio_path)).play().catch(() => {});
  }, [word]);

  // พลิกดูคำแปลครั้งแรกของคำไหน = เริ่มเรียนคำนั้น (สร้างการ์ดทวน → "เรียนแล้ว" ทุกหน้าขยับตามจริง)
  useEffect(() => {
    if (flipped && word && !seenRef.current.has(word.id)) {
      review(word.id, Rating.Good);
      seenRef.current.add(word.id);
    }
  }, [flipped, word]);

  const go = useCallback(
    (delta: number) => {
      if (delta > 0 && idx >= words.length - 1 && words.length > 0) {
        setFinished(true);
        return;
      }
      setFlipped(false);
      setIdx((i) => Math.min(Math.max(i + delta, 0), words.length - 1));
    },
    [words.length, idx]
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
  if (error) return <ErrorState detail={error} />;
  if (!word)
    return (
      <Center>
        ไม่พบคำศัพท์ —{" "}
        <Link href="/" className="ml-1 text-ocean-500 underline">
          กลับหน้าแรก
        </Link>
      </Center>
    );

  // ---------- จบชุด ----------
  if (finished) {
    return (
      <div className="flex flex-col items-center gap-5 p-5">
        <Mascot className="mt-8 h-20 w-20" />
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-ocean-900">จบชุดบัตรคำแล้ว!</h1>
        <p className="text-center text-sm text-slate-500">
          ดูไป {words.length} คำ — คำที่พลิกดูแล้วจะทยอยเข้าคิวทวนให้อัตโนมัติ
        </p>
        {cat ? (
          <div className="flex w-full flex-col gap-2">
            <Link
              href={`/practice?cat=${cat}&mode=listen`}
              className="w-full rounded-xl bg-ocean-700 px-4 py-3.5 text-center font-semibold text-white shadow transition hover:bg-ocean-900 active:scale-[0.98]"
            >
              ไปฝึกฟังหมวดนี้ต่อ
            </Link>
            <Link
              href={`/learn/category?cat=${cat}`}
              className="w-full rounded-xl bg-slate-100 px-4 py-3 text-center font-medium text-slate-600 transition hover:bg-slate-200"
            >
              กลับเมนูหมวด
            </Link>
          </div>
        ) : (
          <Link
            href="/"
            className="w-full rounded-xl bg-ocean-700 px-4 py-3.5 text-center font-semibold text-white shadow transition hover:bg-ocean-900 active:scale-[0.98]"
          >
            กลับหน้าแรก
          </Link>
        )}
        <button
          onClick={() => {
            setFinished(false);
            setIdx(0);
            setFlipped(false);
          }}
          className="text-sm text-slate-400 underline"
        >
          ดูซ้ำอีกรอบ
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-5">
      <div className="w-full">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="flex items-center gap-2">
            {cat && (
              <Link
                href={`/learn/category?cat=${cat}`}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 transition hover:bg-slate-200"
              >
                <Icon name="arrowLeft" className="h-3 w-3" /> หมวด
              </Link>
            )}
            {cat ? `บัตรคำ · ${catName(cat) ?? `หมวด ${cat}`}` : "บัตรคำ HSK 1"}
          </span>
          <span className="tabular-nums">{reviewMode ? `ตรวจแล้ว ${reviewedCount}/${words.length}` : `${idx + 1}/${words.length}`}</span>
        </div>
        <ProgressBar
          className="mt-2"
          size="lg"
          value={reviewMode ? reviewedCount : idx + 1}
          max={words.length}
          label="ความคืบหน้าในชุดบัตรคำ"
        />
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
            <div className="text-4xl font-semibold text-ocean-800">{word.meaning_th || "—"}</div>
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
          className="flex items-center gap-2 rounded-full bg-ocean-700 px-7 py-3.5 font-semibold text-white shadow-lg shadow-ocean-900/30 transition hover:bg-ocean-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-300 focus-visible:ring-offset-2"
        >
          <Icon name="speaker" className="h-5 w-5" /> ฟัง
        </button>
        <button
          onClick={() => go(1)}
          aria-label="คำถัดไป"
          className={`inline-flex items-center gap-1 rounded-xl px-5 py-3 font-medium transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 ${
            idx === words.length - 1
              ? "bg-correct text-white shadow hover:opacity-90 focus-visible:ring-emerald-300"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 focus-visible:ring-slate-300"
          }`}
        >
          {idx === words.length - 1 ? "จบชุด" : "ถัดไป"} <Icon name="arrowRight" className="h-4 w-4" />
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


// อ่าน ?cat=&review= ผ่าน useSearchParams — key ตาม query ให้เปลี่ยน URL แล้ว state รีเซ็ตเสมอ
export default function Flashcards() {
  return (
    <Suspense fallback={<Center>กำลังโหลดคำศัพท์...</Center>}>
      <FlashcardsFromQuery />
    </Suspense>
  );
}

function FlashcardsFromQuery() {
  const sp = useSearchParams();
  const cat = Number(sp.get("cat")) || null;
  const reviewMode = sp.get("review") === "1";
  return <FlashcardsInner key={sp.toString()} cat={cat} reviewMode={reviewMode} />;
}
