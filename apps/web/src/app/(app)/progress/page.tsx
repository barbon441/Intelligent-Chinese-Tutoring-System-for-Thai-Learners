"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadRounds, summarize, clearRounds, bySkill, weakestSkill, type Round } from "@/lib/progress";
import { loadCards } from "@/lib/fsrs";
import { Icon } from "@/components/Icon";
import { ProgressBar } from "@/components/ProgressBar";
import { MascotSays } from "@/components/Mascot";

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
  const skills = bySkill(rounds);
  const weak = weakestSkill(rounds);

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-ocean-900">ผลการเดินทาง</h1>
        <p className="mt-0.5 text-sm text-slate-500">ความคืบหน้าและสถิติการฝึกของคุณ</p>
      </header>

      {/* สรุปการฝึก */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-600 p-6 text-white shadow-lg shadow-ocean-900/20">
        <span aria-hidden="true" className="absolute left-8 top-5 h-1 w-1 rounded-full bg-white/50" />
        <span aria-hidden="true" className="absolute right-12 top-8 h-1.5 w-1.5 rounded-full bg-white/40" />
        <span aria-hidden="true" className="absolute right-7 top-4 h-1 w-1 rounded-full bg-white/30" />
        <div className="relative">
          <div className="text-sm text-ocean-100">ความแม่นยำรวม</div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-5xl font-bold">
            {s.totalQuestions ? Math.round(s.accuracy * 100) : "—"}
            {s.totalQuestions ? <span className="text-2xl font-normal text-ocean-100">%</span> : null}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <MiniStat label="รอบที่ฝึก" value={`${s.totalRounds}`} />
            <MiniStat label="ตอบถูก" value={`${s.totalCorrect}/${s.totalQuestions}`} />
            <MiniStat label="ฝึกต่อเนื่อง" value={`${s.streakDays} วัน`} />
          </div>
        </div>
      </section>

      {/* จุดที่ควรฝึกเพิ่ม — คิดจากรอบฝึกจริงเท่านั้น ทักษะที่ยังไม่เคยฝึกจะไม่เดาเป็น 0% */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
          <Icon name="compass" className="h-4 w-4" />
          จุดที่ควรฝึกเพิ่ม
        </h2>
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4">
          {skills.map((sk) => (
            <div key={sk.mode}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="text-slate-600">{sk.label}</span>
                <span className="tabular-nums text-slate-400">
                  {sk.pct === null ? "ยังไม่เคยฝึก" : `${sk.pct}% · ${sk.correct}/${sk.total} ข้อ`}
                </span>
              </div>
              <ProgressBar
                value={sk.pct ?? 0}
                tone={sk.pct !== null && weak?.mode === sk.mode ? "star" : "ocean"}
                label={`ความแม่นยำ ${sk.label}`}
              />
            </div>
          ))}

          <div className="mt-1 border-t border-slate-100 pt-3">
            {weak ? (
              <>
                <MascotSays mascotClassName="h-10 w-10">
                  ลอง{weak.label}เพิ่มอีกนิด แล้วค่อยเดินทางต่อนะ ⭐
                </MascotSays>
                <Link
                  href={weak.mode === "order" ? "/practice?mode=order" : `/practice?mode=${weak.mode}`}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-ocean-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-800 active:scale-[0.98]"
                >
                  {weak.label} <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="text-xs leading-relaxed text-slate-500">
                ฝึกให้ครบสัก 5 ข้อในแต่ละทักษะก่อน แล้วดาวจะบอกได้ว่าควรเน้นตรงไหน
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ความคืบหน้าของฉัน */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">คลังคำของฉัน</h2>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>คำที่เรียนแล้ว</span>
            <span className="tabular-nums">
              {learned}/{total ?? "…"}
            </span>
          </div>
          <ProgressBar value={learned} max={total ?? 300} label="คำที่เรียนแล้ว" />
          <p className="mt-2 text-[11px] text-slate-400">นับจากคำที่เริ่มเรียนแล้ว — เปิดบัตรคำ/ทวนแล้วตัวเลขนี้จะขยับ</p>
        </div>
      </section>

      {/* ประวัติการฝึกล่าสุด */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">การฝึกล่าสุด</h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            ยังไม่มีการฝึก —{" "}
            <Link href="/practice" className="text-ocean-500 underline">
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
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-ocean-50 text-ocean-700">
                    <Icon name={r.mode === "read" ? "book" : r.mode === "listen" ? "headphone" : "puzzle"} className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-600">
                      {r.mode === "read" ? "ฝึกการอ่าน" : r.mode === "listen" ? "ฝึกการฟัง" : "เรียงประโยค"}
                    </div>
                    <div className="text-[11px] text-slate-400">{fmt(r.ts)}</div>
                  </div>
                  <div className={`text-sm font-semibold ${pct >= 60 ? "text-correct" : "text-coral"}`}>
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
          className="mx-auto text-xs text-slate-400 hover:text-coral"
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
      <div className="text-[11px] text-ocean-100">{label}</div>
    </div>
  );
}

function fmt(ts: number): string {
  const d = new Date(ts);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(d.getDate())}/${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`;
}
