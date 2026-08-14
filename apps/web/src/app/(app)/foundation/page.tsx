"use client";

// 🔤 พื้นฐานเสียง (Foundation)
// กรอบที่อาจารย์ย้ำ: Foundation คือ "หนึ่งใน content" ไม่ใช่ระดับที่แยกออกจากระบบ
//   → ใครทำ pre-test ได้ต่ำมากค่อยแนะให้เริ่มตรงนี้ · ใครพื้นดีข้ามไปเลือกหมวดได้เลย ไม่ล็อก
//
// ⚠️ เดโม: เนื้อหาในหน้านี้ยังเป็นโครง (mockData.FOUNDATION_STEPS) แบบฝึกจริงรอโมดูล 0

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Pinyin } from "@/components/Pinyin";
import { ProgressBar } from "@/components/ProgressBar";
import { MascotSays } from "@/components/Mascot";
import { CATEGORIES } from "@/data/categories";
import { FOUNDATION_STEPS } from "@/data/mockData";
import { speakZh, onVoicesReady } from "@/lib/speak";

// วรรณยุกต์ 4 เสียง — จุดที่คนไทยพลาดบ่อยสุดคือเสียง 2 กับ 3 (คลัง Thai-L1)
const TONES = [
  { pinyin: "mā", zh: "妈", th: "แม่", note: "เสียงสูงราบ ลากยาวเสมอกัน" },
  { pinyin: "má", zh: "麻", th: "ป่าน", note: "เสียงขึ้น — คล้ายเสียงถามของไทย" },
  { pinyin: "mǎ", zh: "马", th: "ม้า", note: "ลงแล้วขึ้น — ยาวที่สุดในสี่เสียง" },
  { pinyin: "mà", zh: "骂", th: "ด่า", note: "ตกลงห้วน ๆ สั้น หนักแน่น" },
];

// คู่เสียงที่คนไทยแยกยาก (เสียงม้วนลิ้น vs ไม่ม้วน)
const PAIRS = [
  { a: "zhī", b: "zī", aZh: "知", bZh: "资" },
  { a: "chī", b: "cī", aZh: "吃", bZh: "疵" },
  { a: "shī", b: "sī", aZh: "师", bZh: "思" },
];

export default function Foundation() {
  const [voiceReady, setVoiceReady] = useState(true);
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => onVoicesReady(setVoiceReady), []);

  function say(zh: string) {
    if (!speakZh(zh)) setVoiceReady(false);
  }

  function toggle(i: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <Link href="/journey" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
          <Icon name="arrowLeft" className="h-3.5 w-3.5" /> เส้นทาง
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ocean-50 text-ocean-700">
            <Icon name="speaker" className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-lg font-bold text-ocean-900">พื้นฐานเสียง</h1>
            <p className="text-xs text-slate-500">พินอิน · วรรณยุกต์ · ฝึกหูแยกเสียง</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ProgressBar value={done.size} max={FOUNDATION_STEPS.length} label="ความคืบหน้าพื้นฐานเสียง" />
          <span className="shrink-0 text-xs tabular-nums text-slate-400">{done.size}/{FOUNDATION_STEPS.length} ด่าน</span>
        </div>
      </header>

      <MascotSays>
        ตรงนี้ไม่ใช่ระดับแยกนะ — เป็นเรื่องหนึ่งที่เรียนได้เหมือนหมวดอื่น ถ้าอ่านพินอินออกอยู่แล้วข้ามไปเลยก็ได้ ⭐
      </MascotSays>

      {/* ---------- 4 ด่านของพื้นฐานเสียง ---------- */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">ด่านในเรื่องนี้</h2>
        <div className="flex flex-col gap-2.5">
          {FOUNDATION_STEPS.map((s, i) => {
            const isDone = done.has(i);
            return (
              <button
                key={s.title}
                onClick={() => toggle(i)}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
                  isDone ? "border-emerald-200 bg-emerald-50/50" : "border-slate-100 bg-white hover:border-ocean-300"
                }`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    isDone ? "bg-correct text-white" : "bg-ocean-50 text-ocean-700"
                  }`}
                >
                  <Icon name={isDone ? "check" : s.icon} className="h-5 w-5" strokeWidth={isDone ? 2.6 : 1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-700">{i + 1}. {s.title}</div>
                  <div className="mt-0.5 text-xs leading-snug text-slate-500">{s.desc}</div>
                  {s.sample && (
                    <div className="mt-1.5 inline-block rounded-md bg-ocean-50 px-2 py-1 font-[family-name:var(--font-mono,inherit)] text-xs text-ocean-700">
                      {s.sample}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">แตะการ์ดเพื่อทำเครื่องหมายว่าผ่านแล้ว (เดโม)</p>
      </section>

      {/* ---------- ลองฟัง 4 เสียง ---------- */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">ลองฟัง 4 เสียง</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          {TONES.map((t, i) => (
            <button
              key={t.pinyin}
              onClick={() => say(t.zh)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ocean-50/60 ${
                i > 0 ? "border-t border-slate-50" : ""
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ocean-50 text-xs font-bold text-ocean-700">
                {i + 1}
              </span>
              <span className="font-[family-name:var(--font-sc)] text-2xl text-slate-900">{t.zh}</span>
              <span className="min-w-0 flex-1">
                <Pinyin text={t.pinyin} className="text-lg font-semibold" />
                <span className="block text-[11px] leading-snug text-slate-500">{t.th} · {t.note}</span>
              </span>
              <Icon name="speaker" className="h-5 w-5 shrink-0 text-ocean-400" />
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          สีของพินอินบอกวรรณยุกต์ — ตั้งใจให้เสียง 2 (ส้ม) กับเสียง 3 (เขียว) ต่างกันชัด เพราะเป็นคู่ที่คนไทยสลับบ่อยที่สุด
        </p>
      </section>

      {/* ---------- คู่เสียงที่คนไทยแยกยาก ---------- */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">คู่เสียงที่คนไทยแยกยาก</h2>
        <div className="grid gap-2.5">
          {PAIRS.map((p) => (
            <div key={p.a} className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3">
              <button
                onClick={() => say(p.aZh)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ocean-50 py-2.5 transition hover:bg-ocean-100 active:scale-95"
              >
                <Pinyin text={p.a} className="text-lg font-semibold" />
                <Icon name="speaker" className="h-4 w-4 text-ocean-500" />
              </button>
              <span className="shrink-0 text-xs text-slate-400">เทียบ</span>
              <button
                onClick={() => say(p.bZh)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ocean-50 py-2.5 transition hover:bg-ocean-100 active:scale-95"
              >
                <Pinyin text={p.b} className="text-lg font-semibold" />
                <Icon name="speaker" className="h-4 w-4 text-ocean-500" />
              </button>
            </div>
          ))}
        </div>
        {!voiceReady && (
          <p className="mt-2 rounded-xl bg-coral-soft px-3 py-2 text-xs leading-relaxed text-coral">
            เครื่องนี้ยังไม่มีเสียงภาษาจีนติดตั้ง เลยยังฟังตัวอย่างไม่ได้ — ของจริงจะใช้ไฟล์เสียงที่อัดไว้เอง ไม่ต้องพึ่งเครื่องผู้ใช้
          </p>
        )}
      </section>

      <Link
        href={`/learn/category?cat=${CATEGORIES[0].id}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-900 px-5 py-4 font-semibold text-white shadow transition hover:bg-ocean-800 active:scale-[0.98]"
      >
        ไปต่อที่หมวด 1 · {CATEGORIES[0].name} <Icon name="arrowRight" className="h-4 w-4" />
      </Link>
    </div>
  );
}
