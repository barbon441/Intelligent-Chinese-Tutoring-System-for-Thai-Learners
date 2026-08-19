"use client";

// สถานะ "การเดินทาง" ของผู้เรียน — รวมที่เดียวเพราะหน้าแรกกับหน้าเส้นทางใช้ตัวเลขชุดเดียวกัน
// (ก่อนหน้านี้หน้าแรกยิง Supabase + อ่าน localStorage เอง ถ้าหน้าเส้นทางก๊อปไปอีกชุดจะเริ่มเพี้ยนกัน)
//
// ทุกตัวเลขในนี้มาจากข้อมูลจริง: คลังคำ Supabase + การ์ด FSRS + ผลควิซ + รอบฝึก ในเครื่องผู้เรียน
// ไม่มีค่าสมมติ — ถ้ายังไม่มีข้อมูลจะคืน null ให้หน้าจอไปตัดสินใจว่าจะพูดว่าอะไร

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, type Category } from "@/data/categories";
import { buildQueue, loadCards } from "@/lib/fsrs";
import { bestScore, QUIZ_PASS, QUIZ_TOTAL } from "@/lib/quiz";
import { loadRounds, summarize, weakestSkill, type ProgressSummary, type SkillStat } from "@/lib/progress";
import type { NodeStatus } from "@/components/JourneyNode";

export type Island = {
  cat: Category;
  total: number; // คำทั้งหมดในหมวด
  learned: number; // คำที่เริ่มเรียนแล้ว
  quizBest: number | null; // คะแนนควิซท้ายหมวดครั้งดีสุด
  passed: boolean; // ผ่านควิซท้ายหมวดแล้ว (≥ QUIZ_PASS)
  status: NodeStatus;
};

export type Journey = {
  loading: boolean;
  islands: Island[];
  totalWords: number;
  learnedWords: number;
  /** % คำที่เริ่มเรียนแล้วของทั้งระดับ — คือ "เดินทางมาได้เท่าไหร่" ไม่ใช่ "ความพร้อมสอบ" */
  levelPct: number;
  due: number | null; // คำที่ถึงกำหนดทวนวันนี้ (null = ยังโหลดไม่เสร็จ)
  streakDays: number;
  totalRounds: number; // จำนวนรอบฝึกที่เคยทำ
  accuracyPct: number | null; // ความแม่นยำรวม % (null = ยังไม่เคยฝึก — ห้ามโชว์ 0%)
  /** จุดแวะที่ควรไปต่อ — หมวดแรกที่ยังไม่ผ่าน */
  current: Island | null;
  /** ทักษะที่อ่อนสุดจากการฝึกจริง (ต้องเคยฝึก ≥5 ข้อ) */
  weakest: SkillStat | null;
  /** คำที่ถึงกำหนดทวนวันนี้ตัวจริงจาก FSRS (สูงสุด 6 คำแรก — ค้างนานสุดก่อน) */
  dueWords: { hanzi: string; pinyin: string; meaning_th: string }[];
};

export const LEVEL_QUIZ_FULL = CATEGORIES.length * QUIZ_TOTAL;

export function useJourney(): Journey {
  const [rows, setRows] = useState<
    { id: number; category: number | null; hanzi: string; pinyin: string; meaning_th: string }[]
  >([]);
  const [due, setDue] = useState<number | null>(null);
  const [dueIds, setDueIds] = useState<number[]>([]);
  const [learnedIds, setLearnedIds] = useState<Set<number>>(new Set());
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [weakest, setWeakest] = useState<SkillStat | null>(null);
  const [quizBests, setQuizBests] = useState<Map<number, number | null>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      // ---- ข้อมูลในเครื่อง (localStorage) — อ่านก่อน await จึงขึ้นจอทันทีไม่ต้องรอเน็ต ----
      const rounds = loadRounds();
      setLearnedIds(new Set(Object.keys(loadCards()).map(Number)));
      setSummary(summarize(rounds));
      setWeakest(weakestSkill(rounds));
      setQuizBests(new Map(CATEGORIES.map((c) => [c.id, bestScore(c.id)])));

      // ---- คลังคำจาก Supabase ----
      const { data } = await supabase
        .from("words")
        .select("id, category, hanzi, pinyin, meaning_th")
        .eq("hsk_level", 1);
      if (!alive) return; // ออกจากหน้าไปแล้ว อย่า setState ต่อ
      if (data) {
        setRows(data);
        const q = buildQueue(data.map((w) => w.id));
        setDue(q.due.length);
        setDueIds(q.due);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    const counts = new Map<number, { total: number; learned: number }>();
    for (const c of CATEGORIES) counts.set(c.id, { total: 0, learned: 0 });
    for (const r of rows) {
      const bucket = r.category ? counts.get(r.category) : undefined;
      if (!bucket) continue;
      bucket.total += 1;
      if (learnedIds.has(r.id)) bucket.learned += 1;
    }

    const base = CATEGORIES.map((cat) => {
      const { total, learned } = counts.get(cat.id) ?? { total: 0, learned: 0 };
      const quizBest = quizBests.get(cat.id) ?? null;
      return { cat, total, learned, quizBest, passed: (quizBest ?? 0) >= QUIZ_PASS };
    });

    // หมวดแรกที่ยังไม่ผ่าน = จุดที่ผู้เรียนกำลังอยู่ · หมวดถัดไปเป็น "ยังไม่ถึง" (แต่กดเข้าไปได้ ไม่ล็อก)
    const currentIdx = base.findIndex((b) => !b.passed);
    const islands: Island[] = base.map((b, i) => ({
      ...b,
      status: b.passed ? "done" : i === currentIdx ? "current" : "upcoming",
    }));

    const totalWords = rows.length;
    const learnedWords = rows.filter((r) => learnedIds.has(r.id)).length;

    return {
      loading,
      islands,
      totalWords,
      learnedWords,
      levelPct: totalWords ? Math.round((learnedWords / totalWords) * 100) : 0,
      due,
      streakDays: summary?.streakDays ?? 0,
      totalRounds: summary?.totalRounds ?? 0,
      accuracyPct: summary && summary.totalQuestions ? Math.round(summary.accuracy * 100) : null,
      current: currentIdx >= 0 ? islands[currentIdx] : null,
      weakest,
      dueWords: dueIds
        .slice(0, 6)
        .map((id) => rows.find((r) => r.id === id))
        .filter((r): r is (typeof rows)[number] => !!r)
        .map((r) => ({ hanzi: r.hanzi, pinyin: r.pinyin, meaning_th: r.meaning_th })),
    };
  }, [rows, learnedIds, quizBests, due, dueIds, summary, weakest, loading]);
}
