// คลังผลควิซท้ายหมวด (m3-2) — เก็บ localStorage ก่อน พอมี Auth (m7-1) ค่อยย้ายขึ้น Supabase
// กฎที่ตัวนี้รับผิดชอบ:
//   QZ-02 ผ่าน ≥7/10 · QZ-08 คะแนนเก็บ = ครั้งที่ดีที่สุดต่อหมวด (10 คะแนน × 5 หมวด = 50)
//   QZ-09 ทำซ้ำได้ไม่จำกัด โชว์ครั้งดีสุด แต่ log ทุกครั้ง/ทุกข้อ (อาหารของ BKT ในโมดูล 8)

export type QuizSkill = "listen" | "read" | "write";

export type QuizItemLog = {
  skill: QuizSkill;
  ref: number; // word id (ฟัง/อ่าน) หรือ sentence id (เขียน)
  correct: boolean;
};

export type QuizAttempt = {
  ts: number; // เวลาจบควิซ (epoch ms)
  cat: number; // หมวด 1-5
  total: number; // 10
  score: number; // ข้อที่ถูก
  items: QuizItemLog[];
};

export const QUIZ_TOTAL = 10;
export const QUIZ_PASS = 7; // QZ-02 — ห้ามลดตามใจ (QZ-06: อย่าให้สองเกณฑ์ปนกัน)

const KEY = "jrj_quiz_attempts";
// เพดานกันล้นเท่านั้น — log รายข้อคืออาหารของ BKT (QZ-09) ห้ามตั้งต่ำจนทิ้งประวัติผู้เรียนขยัน
// (~0.5KB/ครั้ง × 2000 ≈ 1MB ยังห่างลิมิต localStorage) · ย้ายขึ้น Supabase เมื่อมี m7-1
const MAX = 2000;

export function loadAttempts(): QuizAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QuizAttempt[]) : [];
  } catch {
    return [];
  }
}

export function saveAttempt(a: QuizAttempt): void {
  if (typeof window === "undefined") return;
  const all = [...loadAttempts(), a].slice(-MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage เต็ม/ปิด — ข้าม */
  }
}

/** คะแนนเก็บของหมวด = ครั้งที่ดีที่สุด (QZ-09) · null = ยังไม่เคยสอบ */
export function bestScore(cat: number): number | null {
  const of = loadAttempts().filter((a) => a.cat === cat);
  return of.length ? Math.max(...of.map((a) => a.score)) : null;
}

/** คะแนนเก็บรวมทุกหมวด (เต็ม 50 ตาม QZ-08) */
export function totalBest(): { got: number; full: number } {
  let got = 0;
  for (let c = 1; c <= 5; c++) got += bestScore(c) ?? 0;
  return { got, full: 5 * QUIZ_TOTAL };
}

export function attemptsOf(cat: number): QuizAttempt[] {
  return loadAttempts().filter((a) => a.cat === cat);
}

/**
 * ล็อกเฉพาะควิซ (QZ-12 — บอลเคาะ 14 ส.ค. ตามข้อเสนออาจารย์นัด 4):
 * การเรียน/ฝึกทุกหมวดเปิดเสรีเสมอ (PA-02) แต่ควิซหมวดถัดไปจะเปิดเมื่อ
 * ผ่านควิซหมวดก่อนหน้า (≥7/10 — เกณฑ์เดียวกับ QUIZ_PASS สูงกว่าขั้นต่ำ 50% ที่อาจารย์ขอ)
 */
export function quizUnlocked(cat: number): boolean {
  if (cat <= 1) return true;
  return (bestScore(cat - 1) ?? 0) >= QUIZ_PASS;
}

/**
 * ความแม่นรายทักษะของหมวด จาก log ควิซจริง (แทนตัวเลขสมมติใน mockData)
 * รูปทรงตรงกับ SkillScores ของหน้าจอ: vocab = % คำที่เริ่มเรียนแล้ว (ส่งเข้ามา) ·
 * ฟัง/อ่าน/ประโยค = % ตอบถูกสะสมจากควิซท้ายหมวด · คืน null ถ้ายังไม่เคยสอบเลย (ห้ามเดาเป็น 0)
 */
export function catSkillScores(
  cat: number,
  vocabPct: number
): { vocab: number; listening: number; reading: number; sentence: number } | null {
  const items = attemptsOf(cat).flatMap((a) => a.items);
  if (items.length === 0) return null;
  const pct = (skill: QuizSkill) => {
    const of = items.filter((it) => it.skill === skill);
    return of.length ? Math.round((of.filter((it) => it.correct).length / of.length) * 100) : 0;
  };
  return {
    vocab: Math.round(vocabPct),
    listening: pct("listen"),
    reading: pct("read"),
    sentence: pct("write"),
  };
}
