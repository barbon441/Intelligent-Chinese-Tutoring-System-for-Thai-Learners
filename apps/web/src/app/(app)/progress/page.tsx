"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadRounds, summarize, clearRounds, type Round } from "@/lib/progress";
import { loadCards } from "@/lib/fsrs";
import { Icon } from "@/components/Icon";

export default function Progress() {
  const [total, setTotal] = useState<number | null>(null);
  const [learned, setLearned] = useState(0);
  const [rounds, setRounds] = useState<Round[]>([]);

  useEffect(() => {
    setRounds(loadRounds());
    const started = new Set(Object.keys(loadCards()).map(Number));
    (async () => {
      const { data } = await supabase.from("words").select("id").eq("hsk_level", 1);
      if (data) {
        setTotal(data.length);
        setLearned(data.filter((w) => started.has(w.id)).length);
      }
    })();
  }, []);

  const s = summarize(rounds);
  const recent = [...rounds].reverse().slice(0, 8);

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <h1 className="text-xl font-semibold text-slate-700">ผลการเรียน</h1>
        <p className="mt-1 text-sm text-slate-400">ความคืบหน้าและสถิติการฝึกของคุณ</p>
      </header>

      {/* สรุปการฝึก */}
      <section className="rounded-3xl bg-gradient-to-br from-ink-900 via-ink-700 to-ink-500 p-6 text-white shadow-lg">
        <div className="text-sm text-ink-100">ความแม่นยำรวม</div>
        <div className="mt-1 text-5xl font-bold">
          {s.totalQuestions ? Math.round(s.accuracy * 100) : "—"}
          {s.totalQuestions ? <span className="text-2xl font-normal text-ink-100">%</span> : null}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <MiniStat label="รอบที่ฝึก" value={`${s.totalRounds}`} />
          <MiniStat label="ตอบถูก" value={`${s.totalCorrect}/${s.totalQuestions}`} />
          <MiniStat label="ฝึกต่อเนื่อง" value={`${s.streakDays} วัน`} />
        </div>
      </section>

      {/* ความคืบหน้าของฉัน */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">คลังคำของฉัน</h2>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <Bar label="คำที่เรียนแล้ว" value={learned} max={total ?? 300} tone="ink" />
          <p className="mt-2 text-[11px] text-slate-400">นับจากคำที่เริ่มเรียนแล้ว — เปิดบัตรคำ/ทวนแล้วตัวเลขนี้จะขยับ</p>
        </div>
      </section>

      {/* ประวัติการฝึกล่าสุด */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">การฝึกล่าสุด</h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            ยังไม่มีการฝึก —{" "}
            <Link href="/practice" className="text-ink-500 underline">
              เริ่มฝึกเลย
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((r, i) => {
              const pct = Math.round((r.correct / r.total) * 100);
              return (
                <div
                  key={rounds.length - i}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink-50 text-ink-700">
                    <Icon name={r.mode === "read" ? "book" : r.mode === "listen" ? "headphone" : "puzzle"} className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-600">
                      {r.mode === "read" ? "ฝึกการอ่าน" : r.mode === "listen" ? "ฝึกการฟัง" : "เรียงประโยค"}
                    </div>
                    <div className="text-[11px] text-slate-400">{fmt(r.ts)}</div>
                  </div>
                  <div className={`text-sm font-semibold ${pct >= 60 ? "text-correct" : "text-seal"}`}>
                    {r.correct}/{r.total}
                    <span className="ml-1 text-xs font-normal text-slate-400">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {rounds.length > 0 && (
        <button
          onClick={() => {
            if (confirm("ล้างประวัติการฝึกทั้งหมด?")) {
              clearRounds();
              setRounds([]);
            }
          }}
          className="mx-auto text-xs text-slate-300 hover:text-rose-400"
        >
          ล้างประวัติการฝึก
        </button>
      )}

      <p className="pb-2 text-center text-[11px] leading-relaxed text-slate-300">
        * ตอนนี้เก็บผลไว้ในเครื่องนี้ก่อน · เมื่อมีระบบล็อกอิน ผลการเรียนจะติดตามบัญชีไปทุกเครื่อง
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 py-2">
      <div className="font-semibold">{value}</div>
      <div className="text-[11px] text-ink-100">{label}</div>
    </div>
  );
}

function Bar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  const tones: Record<string, string> = { ink: "bg-ink-500", correct: "bg-correct" };
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${tones[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function fmt(ts: number): string {
  const d = new Date(ts);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(d.getDate())}/${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`;
}
