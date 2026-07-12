"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { SENTENCES, type SentenceItem } from "@/data/sentences";
import { saveRound } from "@/lib/progress";
import { Icon } from "@/components/Icon";
import { Pinyin } from "@/components/Pinyin";

const N_PER_ROUND = 5;

type Tile = { key: number; text: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeTiles(s: SentenceItem): Tile[] {
  const tiles = s.tokens.map((t, i) => ({ key: i, text: t }));
  let pool = shuffle(tiles);
  // กันสับแล้วได้ลำดับถูกพอดี (จะไม่ท้าทาย) — สับใหม่ถ้าเรียงตรงเป๊ะ
  if (pool.map((t) => t.text).join("") === s.tokens.join("") && s.tokens.length > 1) {
    pool = shuffle(tiles);
  }
  return pool;
}

export default function SentenceOrder({ onExit }: { onExit: () => void }) {
  const round = useMemo(() => shuffle(SENTENCES).slice(0, Math.min(N_PER_ROUND, SENTENCES.length)), []);
  const [qi, setQi] = useState(0);
  const [pool, setPool] = useState<Tile[]>(() => makeTiles(round[0]));
  const [answer, setAnswer] = useState<Tile[]>([]);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const savedRef = useRef(false);

  const s = round[qi];
  const isCorrect = checked && answer.map((t) => t.text).join("") === s.tokens.join("");
  const allPlaced = answer.length === s.tokens.length;

  const pick = useCallback(
    (tile: Tile) => {
      if (checked) return;
      setPool((p) => p.filter((t) => t.key !== tile.key));
      setAnswer((a) => [...a, tile]);
    },
    [checked]
  );

  const unpick = useCallback(
    (tile: Tile) => {
      if (checked) return;
      setAnswer((a) => a.filter((t) => t.key !== tile.key));
      setPool((p) => [...p, tile]);
    },
    [checked]
  );

  function check() {
    setChecked(true);
    if (answer.map((t) => t.text).join("") === s.tokens.join("")) {
      setCorrectCount((c) => c + 1);
    }
  }

  function next() {
    if (qi + 1 >= round.length) {
      setDone(true);
      if (!savedRef.current) {
        saveRound({ ts: Date.now(), mode: "order", total: round.length, correct: correctCount });
        savedRef.current = true;
      }
      return;
    }
    const ni = qi + 1;
    setQi(ni);
    setPool(makeTiles(round[ni]));
    setAnswer([]);
    setChecked(false);
  }

  function restart() {
    onExit(); // กลับเมนู แล้วผู้ใช้กดเข้าใหม่ = สุ่มชุดใหม่
  }

  // ---------- สรุปผล ----------
  if (done) {
    const pct = Math.round((correctCount / round.length) * 100);
    const pass = pct >= 60;
    return (
      <div className="flex flex-col items-center gap-6 p-5">
        <div className={`mt-6 grid h-20 w-20 place-items-center rounded-full ${pass ? "bg-seal-soft text-seal" : "bg-ink-50 text-ink-500"}`}>
          <Icon name={pass ? "sparkles" : "target"} className="h-10 w-10" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-700">{pass ? "เยี่ยมมาก!" : "ฝึกอีกนิด!"}</h1>
        <div className="w-full rounded-3xl bg-gradient-to-br from-ink-900 via-ink-700 to-ink-500 p-6 text-center text-white shadow-lg">
          <div className="font-[family-name:var(--font-display)] text-5xl font-extrabold">
            {correctCount}
            <span className="text-2xl font-normal text-ink-100"> / {round.length}</span>
          </div>
          <div className="mt-1 text-ink-100">เรียงถูก {pct}%</div>
        </div>
        <div className="flex w-full gap-3">
          <button
            onClick={restart}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink-700 px-4 py-3 font-semibold text-white shadow transition hover:bg-ink-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-300 focus-visible:ring-offset-2"
          >
            <Icon name="refresh" className="h-5 w-5" /> กลับเมนูฝึก
          </button>
        </div>
      </div>
    );
  }

  // ---------- ทำข้อ ----------
  return (
    <div className="flex flex-col gap-5 p-5">
      {/* หัว + progress */}
      <div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <button onClick={onExit} className="text-slate-400">
            ← ออก
          </button>
          <span>
            ข้อ {qi + 1}/{round.length} · ถูก {correctCount}
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-sky-500 transition-all" style={{ width: `${(qi / round.length) * 100}%` }} />
        </div>
      </div>

      {/* โจทย์: ความหมายไทย */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
        <div className="text-xs text-slate-400">เรียงคำให้เป็นประโยคที่แปลว่า</div>
        <div className="mt-1 text-lg font-semibold text-slate-700">“{s.meaning_th}”</div>
      </div>

      {/* แถวคำตอบ (แตะคำในนี้เพื่อเอาออก) */}
      <div className="flex min-h-[64px] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-3">
        {answer.length === 0 && <span className="text-sm text-slate-300">แตะคำด้านล่างมาเรียงตรงนี้</span>}
        {answer.map((tile) => {
          const cls = checked
            ? isCorrect
              ? "border-emerald-400 bg-emerald-50 text-emerald-800"
              : "border-rose-300 bg-rose-50 text-rose-700"
            : "border-sky-200 bg-white text-slate-800";
          return (
            <button
              key={tile.key}
              onClick={() => unpick(tile)}
              disabled={checked}
              className={`rounded-xl border px-3 py-2 text-xl font-[family-name:var(--font-sc)] shadow-sm transition active:scale-95 ${cls}`}
            >
              {tile.text}
            </button>
          );
        })}
      </div>

      {/* คลังคำ (สับ) */}
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white p-3">
        {pool.map((tile) => (
          <button
            key={tile.key}
            onClick={() => pick(tile)}
            disabled={checked}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xl font-[family-name:var(--font-sc)] text-slate-800 shadow-sm transition hover:border-sky-300 active:scale-95 disabled:opacity-40"
          >
            {tile.text}
          </button>
        ))}
        {pool.length === 0 && !checked && <span className="py-2 text-sm text-slate-300">วางครบแล้ว กด “ตรวจ”</span>}
      </div>

      {/* เฉลยหลังตรวจ */}
      {checked && (
        <div className={`rounded-2xl p-4 ${isCorrect ? "bg-emerald-50" : "bg-rose-50"}`}>
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${isCorrect ? "text-correct" : "text-seal"}`}>
            <Icon name={isCorrect ? "check" : "x"} className="h-4 w-4" strokeWidth={2.4} />
            {isCorrect ? "ถูกต้อง!" : "ยังไม่ถูก — ที่ถูกคือ:"}
          </div>
          <div className="mt-2 text-2xl font-[family-name:var(--font-sc)] text-slate-800">{s.tokens.join(" ")}</div>
          <Pinyin text={s.pinyin} className="text-sm" />
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-white/70 p-2 text-xs text-slate-500">
            <Icon name="bulb" className="mt-0.5 h-4 w-4 shrink-0 text-xp" /> {s.focus_th}
          </div>
        </div>
      )}

      {/* ปุ่มตรวจ / ถัดไป */}
      {!checked ? (
        <button
          onClick={check}
          disabled={!allPlaced}
          className="rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white shadow transition hover:bg-sky-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
        >
          ตรวจ
        </button>
      ) : (
        <button
          onClick={next}
          className="rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white shadow transition hover:bg-sky-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        >
          {qi + 1 >= round.length ? "ดูผล →" : "ข้อถัดไป →"}
        </button>
      )}
    </div>
  );
}
