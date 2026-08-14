// เก็บ "ผลการฝึก" ไว้ในเครื่อง (localStorage) — ยังไม่ต้องมีบัญชีผู้ใช้/ตาราง DB
// พอเราทำ Auth + Knowledge Tracing (M4+) ค่อยย้ายไปเก็บบน Supabase per-user
// รูปแบบข้อมูลตั้งใจให้ตรงกับสิ่งที่ BKT/FSRS ต้องใช้ (ข้อ → ถูก/ผิด → เวลา) ไว้ต่อยอดได้

export type QuizMode = "read" | "listen" | "order";

export type Round = {
  ts: number; // เวลาที่จบรอบ (epoch ms)
  mode: QuizMode;
  total: number;
  correct: number;
};

const KEY = "jrj_practice_rounds";
const MAX = 60; // เก็บย้อนหลังพอประมาณ

export function loadRounds(): Round[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Round[]) : [];
  } catch {
    return [];
  }
}

export function saveRound(r: Round): void {
  if (typeof window === "undefined") return;
  const rounds = [...loadRounds(), r].slice(-MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rounds));
  } catch {
    /* เต็ม/ปิด storage ก็ข้ามไป */
  }
}

export function clearRounds(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ไม่เป็นไร */
  }
}

export type ProgressSummary = {
  totalRounds: number;
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number; // 0..1
  bestAccuracy: number; // ความแม่นรอบที่ดีที่สุด (0..1)
  streakDays: number; // จำนวนวันติดต่อกันที่ฝึก (นับถึงวันนี้)
};

export function summarize(rounds: Round[]): ProgressSummary {
  const totalRounds = rounds.length;
  const totalQuestions = rounds.reduce((s, r) => s + r.total, 0);
  const totalCorrect = rounds.reduce((s, r) => s + r.correct, 0);
  const accuracy = totalQuestions ? totalCorrect / totalQuestions : 0;
  const bestAccuracy = rounds.reduce(
    (m, r) => (r.total ? Math.max(m, r.correct / r.total) : m),
    0
  );

  // นับ streak: วันที่ไม่ซ้ำที่ฝึก ต่อเนื่องจากวันนี้ย้อนหลัง
  const days = new Set(rounds.map((r) => dayKey(r.ts)));
  let streakDays = 0;
  const cur = new Date();
  // ยอมให้เริ่มนับจาก "วันนี้" หรือ "เมื่อวาน" (เผื่อยังไม่ได้ฝึกวันนี้)
  if (!days.has(dayKey(cur.getTime()))) cur.setDate(cur.getDate() - 1);
  while (days.has(dayKey(cur.getTime()))) {
    streakDays += 1;
    cur.setDate(cur.getDate() - 1);
  }

  return { totalRounds, totalQuestions, totalCorrect, accuracy, bestAccuracy, streakDays };
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// ---------- แยกความแม่นยำรายทักษะ (ใช้ในหน้า "จุดที่ควรฝึกเพิ่ม") ----------
// นับจากรอบฝึกจริงที่ผู้เรียนทำเท่านั้น — ทักษะที่ยังไม่เคยฝึก pct = null (ห้ามเดาเป็น 0%)
// หมายเหตุ: นี่คือ "ความแม่นจากการฝึก" ไม่ใช่ค่าความพร้อมสอบเชิงโมเดล (นั่นรอ BKT ในโมดูล 8)

export type SkillStat = {
  mode: QuizMode;
  label: string;
  correct: number;
  total: number;
  pct: number | null; // null = ยังไม่เคยฝึกทักษะนี้
};

export const SKILL_LABEL: Record<QuizMode, string> = {
  listen: "ฝึกฟัง",
  read: "ฝึกอ่าน",
  order: "เรียงประโยค",
};

export function bySkill(rounds: Round[]): SkillStat[] {
  const modes: QuizMode[] = ["listen", "read", "order"];
  return modes.map((mode) => {
    const of = rounds.filter((r) => r.mode === mode);
    const total = of.reduce((s, r) => s + r.total, 0);
    const correct = of.reduce((s, r) => s + r.correct, 0);
    return { mode, label: SKILL_LABEL[mode], correct, total, pct: total ? Math.round((correct / total) * 100) : null };
  });
}

/** ทักษะที่อ่อนสุด = ทักษะที่เคยฝึกแล้วและเปอร์เซ็นต์ต่ำสุด · null = ยังไม่มีข้อมูลพอจะชี้ */
export function weakestSkill(rounds: Round[]): SkillStat | null {
  const tried = bySkill(rounds).filter((s) => s.pct !== null && s.total >= 5);
  if (tried.length === 0) return null;
  return tried.reduce((a, b) => (b.pct! < a.pct! ? b : a));
}
