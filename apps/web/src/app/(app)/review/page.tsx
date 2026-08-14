"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase, audioUrl, type Word } from "@/lib/supabase";
import { buildQueue, loadCards, review, preview, Rating, type Grade } from "@/lib/fsrs";
import { Icon } from "@/components/Icon";
import { Pinyin } from "@/components/Pinyin";
import { Center, ErrorState } from "@/components/Feedback";
import { Mascot, MascotSays } from "@/components/Mascot";
import { ProgressBar } from "@/components/ProgressBar";

export default function Review() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [queue, setQueue] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [freshCount, setFreshCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("words")
        .select("id, hanzi, pinyin, meaning_th, meaning_en, th_reviewed, audio_path, hsk_level")
        .eq("hsk_level", 1)
        .order("id");
      if (error) setError(error.message);
      else {
        setKnownIds(new Set(Object.keys(loadCards()).map(Number)));
        const ws = data as Word[];
        setWords(ws);
        const ids = ws.map((w) => w.id);
        const { due, fresh } = buildQueue(ids);
        const byId = new Map(ws.map((w) => [w.id, w]));
        const q = [...due, ...fresh].map((id) => byId.get(id)!).filter(Boolean);
        setQueue(q);
        setFreshCount(fresh.length);
      }
      setLoading(false);
    })();
  }, []);

  const card = queue[idx];

  const play = useCallback(() => {
    if (card?.audio_path) new Audio(audioUrl(card.audio_path)).play().catch(() => {});
  }, [card]);

  // เล่นเสียงเมื่อขึ้นการ์ดใหม่ (เฉพาะตอนเริ่มทวนแล้ว)
  useEffect(() => {
    if (started && card) play();
  }, [idx, started, card, play]);

  const intervals = useMemo(() => {
    if (!card || !flipped) return null;
    return preview(card.id);
  }, [card, flipped]);

  function rate(rating: Grade) {
    review(card.id, rating);
    setReviewed((n) => n + 1);
    setFlipped(false);
    setIdx((i) => i + 1);
  }

  if (loading) return <Center>กำลังเตรียมคิวทบทวน...</Center>;
  if (error) return <ErrorState detail={error} />;

  // ---------- ไม่มีอะไรต้องทวน ----------
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 p-5">
        <Mascot className="mt-10 h-20 w-20" />
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-ocean-900">ดาวทุกดวงยังสว่างอยู่</h1>
        <p className="text-center text-sm text-slate-500">
          ยังไม่มีคำที่ถึงกำหนดทวน กลับมาใหม่พรุ่งนี้ หรือไปเรียนคำใหม่ก่อนก็ได้
        </p>
        <Link href="/" className="rounded-xl bg-ocean-700 px-5 py-3 font-semibold text-white shadow transition hover:bg-ocean-900">
          กลับไปเดินทางต่อ
        </Link>
      </div>
    );
  }

  // ---------- หน้าเริ่ม (บอกจำนวนคิว) ----------
  if (!started) {
    return (
      <div className="flex flex-col gap-5 p-5">
        <header className="text-center">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-ocean-900">ดาวที่กำลังจาง</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            คำเหล่านี้เริ่มจำได้ไม่แม่น ลองทบทวนอีกครั้งก่อนเดินทางต่อ
          </p>
        </header>

        {/* ท้องฟ้ากลางคืน + จำนวนดาวที่รอ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-600 p-6 text-center text-white shadow-lg shadow-ocean-900/20">
          <span aria-hidden="true" className="absolute left-7 top-5 h-1 w-1 rounded-full bg-white/50" />
          <span aria-hidden="true" className="absolute right-9 top-8 h-1.5 w-1.5 rounded-full bg-white/40" />
          <span aria-hidden="true" className="absolute right-16 top-4 h-1 w-1 rounded-full bg-white/30" />
          <div className="relative">
            <Icon name="star" className="mx-auto h-7 w-7 text-star" fill="currentColor" strokeWidth={0} />
            <div className="mt-2 font-[family-name:var(--font-display)] text-5xl font-bold">{queue.length}</div>
            <div className="mt-1 text-ocean-100">คำรอทบทวนวันนี้</div>
            <div className="mt-2 text-xs text-ocean-100/80">
              {freshCount === queue.length
                ? "วันนี้เป็นคำใหม่ทั้งหมด — เจอครั้งแรก ค่อย ๆ ดูไปทีละคำ"
                : `ถึงกำหนดทวน ${queue.length - freshCount} · คำใหม่ ${freshCount}`}
            </div>
          </div>
        </div>

        <MascotSays>ทวนตอนที่กำลังจะลืมพอดี จะจำได้นานที่สุดเลยนะ ⭐</MascotSays>

        <button
          onClick={() => setStarted(true)}
          className="w-full rounded-xl bg-ocean-900 px-5 py-3.5 font-semibold text-white shadow transition hover:bg-ocean-800 active:scale-[0.98]"
        >
          เริ่มทบทวน
        </button>
        <p className="rounded-2xl bg-ocean-50 p-4 text-center text-[11px] leading-relaxed text-slate-500">
          ระบบคำนวณเองว่าแต่ละคำ “ควรทวนเมื่อไหร่” · เก็บกำหนดไว้ในเครื่องนี้
        </p>
      </div>
    );
  }

  // ---------- จบรอบ ----------
  if (!card) {
    return (
      <div className="flex flex-col items-center gap-5 p-5">
        <Mascot className="mt-10 h-20 w-20" />
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-ocean-900">ทวนจบรอบแล้ว!</h1>
        <p className="text-center text-sm text-slate-500">ทวนไป {reviewed} คำ · ดาวกลับมาสว่างอีกครั้งแล้ว</p>
        <Link
          href="/"
          className="w-full rounded-xl bg-ocean-900 px-4 py-3.5 text-center font-semibold text-white shadow transition hover:bg-ocean-800 active:scale-95"
        >
          เดินทางต่อ
        </Link>
      </div>
    );
  }

  // ---------- กำลังทวน ----------
  return (
    <div className="flex flex-col items-center gap-5 p-5">
      {/* ความคืบหน้า */}
      <div className="w-full">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 transition hover:bg-slate-200">
            <Icon name="arrowLeft" className="h-3 w-3" /> ออก
          </Link>
          <span>
            {idx + 1}/{queue.length}
          </span>
        </div>
        <ProgressBar className="mt-2" size="lg" value={idx} max={queue.length} label="ความคืบหน้าการทบทวน" />
      </div>

      {/* การ์ด */}
      <button
        onClick={() => setFlipped((f) => !f)}
        className="flex aspect-[3/2] w-full flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-xl transition active:scale-[0.99]"
      >
        {!flipped ? (
          <>
            {!knownIds.has(card.id) && (
              <span className="mb-2 rounded-md bg-ocean-50 px-2 py-0.5 text-xs font-bold text-ocean-500">คำใหม่</span>
            )}
            <div className="text-7xl font-bold text-slate-900">{card.hanzi}</div>
            <Pinyin text={card.pinyin} className="mt-3 text-2xl font-medium" />
            <div className="mt-6 text-xs text-slate-400">
              {knownIds.has(card.id) ? "แตะเพื่อดูคำแปล แล้วให้คะแนนว่าจำได้แค่ไหน" : "เพิ่งเจอครั้งแรก — จำหน้าตาไว้ แล้วแตะดูคำแปล"}
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl font-semibold text-ocean-800">{card.meaning_th || "—"}</div>
            <div className="mt-3 flex items-center gap-2 text-2xl text-slate-500">
              <span className="font-[family-name:var(--font-sc)]">{card.hanzi}</span>
              <span>·</span>
              <Pinyin text={card.pinyin} className="font-medium" />
            </div>
            <div className="mt-2 text-sm text-slate-400">{(card.meaning_en ?? []).slice(0, 2).join("; ")}</div>
          </>
        )}
      </button>

      <button
        onClick={play}
        className="inline-flex items-center gap-2 rounded-full bg-ocean-700 px-6 py-2.5 font-medium text-white shadow transition hover:bg-ocean-900 active:scale-95"
      >
        <Icon name="speaker" className="h-5 w-5" /> ฟัง
      </button>

      {/* ปุ่มให้คะแนน (โผล่หลังพลิก) */}
      {flipped ? (
        <div className="grid w-full grid-cols-4 gap-2">
          <RateBtn label="ลืม" color="bg-coral" sub={intervals?.again} onClick={() => rate(Rating.Again)} />
          <RateBtn label="ยาก" color="bg-amber-500" sub={intervals?.hard} onClick={() => rate(Rating.Hard)} />
          <RateBtn label="ปกติ" color="bg-ocean-500" sub={intervals?.good} onClick={() => rate(Rating.Good)} />
          <RateBtn label="ง่าย" color="bg-correct" sub={intervals?.easy} onClick={() => rate(Rating.Easy)} />
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="w-full rounded-xl bg-slate-100 px-4 py-3 text-slate-600"
        >
          ดูคำแปล
        </button>
      )}
    </div>
  );
}

function RateBtn({
  label,
  sub,
  color,
  onClick,
}: {
  label: string;
  sub?: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-2.5 text-white shadow ${color} active:scale-95`}
    >
      <span className="text-sm font-semibold">{label}</span>
      {sub && <span className="text-[10px] opacity-90">{sub}</span>}
    </button>
  );
}

