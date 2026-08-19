"use client";

// เกมจับคู่คำศัพท์ (m2-9) — อีกท่าของการฝึกดึงความจำ สนุกกว่าข้อเลือกตอบ
// กติกาเนื้อหา: หยิบเฉพาะคำที่เรียนแล้ว (PA-14) — เกมมีไว้ทวน ไม่ใช่เจอคำแปลกหน้า
// สองโหมด: คำจีน↔คำแปล · เสียง↔ตัวจีน (โหมดฝึก เสียงช้าได้ตาม m2-7)

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, audioUrl, type Word } from "@/lib/supabase";
import { catName } from "@/data/categories";
import { Center, ErrorState } from "@/components/Feedback";
import { Icon } from "@/components/Icon";
import { Pinyin } from "@/components/Pinyin";
import { Mascot } from "@/components/Mascot";
import { loadCards } from "@/lib/fsrs";
import { shuffle } from "@/lib/random";
import { saveRound } from "@/lib/progress";
import { playAtUserRate } from "@/lib/daily";

const PAIRS = 6;

type GameMode = "meaning" | "sound";
type Tile = { key: string; wordId: number; side: "a" | "b"; word: Word };

function MatchInner({ cat }: { cat: number | null }) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<GameMode | null>(null);
  const [round, setRound] = useState(0); // เปลี่ยนค่า = สุ่มกระดานใหม่
  const [picked, setPicked] = useState<Tile | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const savedRef = useRef(false);
  const [learnedIds] = useState(() => new Set(Object.keys(loadCards()).map(Number)));

  useEffect(() => {
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

  // PA-14: เกมทวนเฉพาะคำที่เรียนแล้ว · โหมดเสียงต้องมีไฟล์เสียงด้วย
  const pools = useMemo(() => {
    const learned = words.filter((w) => learnedIds.has(w.id) && w.meaning_th && w.meaning_th.trim());
    return { meaning: learned, sound: learned.filter((w) => w.audio_path) };
  }, [words, learnedIds]);

  // สุ่มกระดาน: คู่คำไม่ซ้ำความหมาย (กันการ์ดสองใบเฉลยเดียวกัน)
  const board = useMemo(() => {
    if (!mode) return null;
    const pool = pools[mode];
    const chosen: Word[] = [];
    const usedMeaning = new Set<string>();
    for (const w of shuffle(pool)) {
      if (chosen.length >= PAIRS) break;
      if (usedMeaning.has(w.meaning_th)) continue;
      usedMeaning.add(w.meaning_th);
      chosen.push(w);
    }
    if (chosen.length < 4) return null; // คำเรียนแล้วยังน้อยเกินกว่าจะสนุก
    const tiles: Tile[] = shuffle(
      chosen.flatMap((word) => [
        { key: `a-${word.id}`, wordId: word.id, side: "a" as const, word },
        { key: `b-${word.id}`, wordId: word.id, side: "b" as const, word },
      ])
    );
    return { tiles, pairs: chosen.length };
  }, [mode, pools, round]); // eslint-disable-line react-hooks/exhaustive-deps

  // จับเวลาเฉพาะตอนเล่นอยู่
  useEffect(() => {
    if (!mode || done || !board) return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [mode, done, board]);

  function resetRound(nextMode: GameMode | null = mode) {
    setMode(nextMode);
    setRound((r) => r + 1);
    setPicked(null);
    setMatched(new Set());
    setWrongPair(null);
    setMistakes(0);
    setSeconds(0);
    setDone(false);
    savedRef.current = false;
  }

  function tap(tile: Tile) {
    if (!board || done || matched.has(tile.wordId) || wrongPair) return;
    // โหมดเสียง: แตะการ์ดลำโพง = เล่นเสียงเสมอ (ฝึกหูไปในตัว)
    if (mode === "sound" && tile.side === "a" && tile.word.audio_path) {
      playAtUserRate(audioUrl(tile.word.audio_path));
    }
    if (!picked) {
      setPicked(tile);
      return;
    }
    if (picked.key === tile.key) {
      setPicked(null); // แตะใบเดิมซ้ำ = ยกเลิก
      return;
    }
    if (picked.wordId === tile.wordId && picked.side !== tile.side) {
      const next = new Set(matched);
      next.add(tile.wordId);
      setMatched(next);
      setPicked(null);
      if (next.size === board.pairs) {
        setDone(true);
        if (!savedRef.current) {
          // total = จำนวนครั้งที่จับ (คู่ที่ถูก + ครั้งที่พลาด) → ความแม่นสะท้อนของจริง
          saveRound({ ts: Date.now(), mode: "match", total: board.pairs + mistakes, correct: board.pairs });
          savedRef.current = true;
        }
      }
    } else {
      setMistakes((m) => m + 1);
      setWrongPair([picked.key, tile.key]);
      setPicked(null);
      window.setTimeout(() => setWrongPair(null), 550);
    }
  }

  if (loading) return <Center>กำลังโหลดคลังคำ...</Center>;
  if (error) return <ErrorState detail={error} />;

  const backHref = cat ? `/learn/category?cat=${cat}` : "/practice";

  // ---------- เลือกโหมด ----------
  if (!mode) {
    const enough = pools.meaning.length >= 4;
    return (
      <div className="flex flex-col gap-5 p-5">
        <header>
          <Link href={backHref} className="mb-1 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
            <Icon name="arrowLeft" className="h-3.5 w-3.5" /> กลับ
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-ocean-900">
            เกมจับคู่{cat ? ` · ${catName(cat) ?? `หมวด ${cat}`}` : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-400">เปิดการ์ดจับคู่ให้ครบ — ทวนคำที่เรียนแล้วแบบไม่รู้ตัวว่ากำลังทวน</p>
        </header>

        {!enough && (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-700">
            ต้องเรียนคำ{cat ? "ในหมวดนี้" : ""}อย่างน้อย 4 คำก่อนถึงจะเล่นได้ — ไปเปิดบัตรคำสักหน่อยแล้วค่อยกลับมานะ
          </div>
        )}
        {!enough && (
          <Link
            href={cat ? `/flashcards?cat=${cat}` : "/flashcards"}
            className="rounded-xl bg-ocean-700 px-4 py-3.5 text-center font-semibold text-white shadow transition hover:bg-ocean-900"
          >
            ไปเรียนคำศัพท์ก่อน
          </Link>
        )}

        {enough && (
          <>
            <button
              onClick={() => resetRound("meaning")}
              className="flex items-center gap-3 rounded-2xl border border-ocean-200 bg-ocean-50/50 p-4 text-left transition hover:border-ocean-400 active:scale-[0.99]"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ocean-700 text-white">
                <Icon name="cards" className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-700">คำจีน ↔ คำแปล</div>
                <div className="text-xs text-slate-400">จับคู่ตัวอักษรจีนกับความหมายไทย · {pools.meaning.length} คำที่เรียนแล้ว</div>
              </div>
              <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-slate-300" />
            </button>
            <button
              onClick={() => (pools.sound.length >= 4 ? resetRound("sound") : undefined)}
              disabled={pools.sound.length < 4}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:border-ocean-300 hover:shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ocean-50 text-ocean-700">
                <Icon name="headphone" className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-700">เสียง ↔ ตัวจีน</div>
                <div className="text-xs text-slate-400">แตะฟังเสียง แล้วหาตัวอักษรที่ตรงกัน · ฝึกหูไปในตัว</div>
              </div>
              <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          </>
        )}
      </div>
    );
  }

  if (!board)
    return (
      <Center>
        คำที่เรียนแล้วยังไม่พอเล่นโหมดนี้ —{" "}
        <button onClick={() => setMode(null)} className="ml-1 text-ocean-500 underline">
          เลือกโหมดอื่น
        </button>
      </Center>
    );

  // ---------- จบกระดาน ----------
  if (done) {
    const perfect = mistakes === 0;
    return (
      <div className="flex flex-col items-center gap-5 p-5">
        <Mascot className="mt-8 h-20 w-20" />
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-ocean-900">
          {perfect ? "จับคู่ครบ ไม่พลาดเลย!" : "จับคู่ครบแล้ว!"}
        </h1>
        <div className="w-full rounded-3xl bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-600 p-6 text-center text-white shadow-lg">
          <div className="font-[family-name:var(--font-display)] text-5xl font-extrabold">
            {board.pairs}
            <span className="text-2xl font-normal text-ocean-100"> คู่</span>
          </div>
          <div className="mt-1 text-sm text-ocean-100">
            ใช้เวลา {seconds} วินาที · พลาด {mistakes} ครั้ง
          </div>
        </div>
        <div className="flex w-full gap-3">
          <button
            onClick={() => resetRound()}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ocean-700 px-4 py-3 font-semibold text-white shadow transition hover:bg-ocean-900 active:scale-95"
          >
            <Icon name="refresh" className="h-5 w-5" /> เล่นอีกรอบ
          </button>
          <button
            onClick={() => resetRound(mode === "meaning" ? "sound" : "meaning")}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-200 active:scale-95"
          >
            สลับโหมด
          </button>
        </div>
        <Link href={backHref} className="text-sm text-slate-400 underline-offset-2 hover:underline">
          กลับเมนู
        </Link>
      </div>
    );
  }

  // ---------- กระดานเล่น ----------
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <button onClick={() => setMode(null)} className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600">
          <Icon name="arrowLeft" className="h-3.5 w-3.5" /> ออก
        </button>
        <span className="tabular-nums">
          จับได้ {matched.size}/{board.pairs} คู่ · {seconds} วิ
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {board.tiles.map((tile) => {
          const isMatched = matched.has(tile.wordId);
          const isPicked = picked?.key === tile.key;
          const isWrong = wrongPair?.includes(tile.key) ?? false;
          const showSpeaker = mode === "sound" && tile.side === "a";
          return (
            <button
              key={tile.key}
              onClick={() => tap(tile)}
              disabled={isMatched}
              aria-label={showSpeaker ? "การ์ดเสียง แตะเพื่อฟัง" : undefined}
              className={`flex aspect-square items-center justify-center rounded-2xl border p-2 text-center transition active:scale-95 ${
                isMatched
                  ? "border-emerald-200 bg-emerald-50 opacity-50"
                  : isWrong
                    ? "border-coral bg-coral/10 animate-pulse"
                    : isPicked
                      ? "border-ocean-500 bg-ocean-50 ring-2 ring-ocean-300"
                      : "border-slate-200 bg-white shadow-sm hover:border-ocean-300"
              }`}
            >
              {showSpeaker ? (
                <Icon name="speaker" className="h-8 w-8 text-ocean-700" />
              ) : tile.side === "a" ? (
                <span className="font-[family-name:var(--font-sc)] text-2xl font-semibold text-slate-900">{tile.word.hanzi}</span>
              ) : mode === "sound" ? (
                <span className="flex flex-col items-center">
                  <span className="font-[family-name:var(--font-sc)] text-2xl font-semibold text-slate-900">{tile.word.hanzi}</span>
                  <Pinyin text={tile.word.pinyin} className="text-[11px]" />
                </span>
              ) : (
                <span className="text-sm leading-snug text-slate-700">{tile.word.meaning_th}</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        {mode === "sound" ? "แตะการ์ดลำโพงเพื่อฟัง แล้วหาตัวอักษรที่ตรงกัน" : "แตะสองใบที่เป็นคู่กัน — ผิดไม่เป็นไร ลองใหม่ได้"}
      </p>
    </div>
  );
}

// อ่าน ?cat= ผ่าน useSearchParams — key ตาม query ให้รีเซ็ตเสมอ
export default function Match() {
  return (
    <Suspense fallback={<Center>กำลังโหลด...</Center>}>
      <MatchFromQuery />
    </Suspense>
  );
}

function MatchFromQuery() {
  const sp = useSearchParams();
  const cat = Number(sp.get("cat")) || null;
  return <MatchInner key={sp.toString()} cat={cat} />;
}
