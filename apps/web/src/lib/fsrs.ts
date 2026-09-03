// โมดูล 4 — ทบทวนเว้นช่วง (FSRS v6 ผ่านไลบรารี ts-fsrs)
// บทบาท: FSRS ตอบ "ทวนเมื่อไหร่" เท่านั้น — ไม่เกี่ยวกับ "แม่นแค่ไหน" (นั่นเป็นงานของ pyBKT ในอนาคต)
// เก็บสถานะการ์ด (D/S/R) ไว้ในเครื่อง (localStorage) ก่อน → ออฟไลน์ได้ทันที
// เมื่อทำ Auth (M4+) ค่อย sync ขึ้น Supabase รายบุคคล — โครงข้อมูลนี้ย้ายขึ้นได้เลย

import {
  fsrs,
  generatorParameters,
  createEmptyCard,
  Rating,
  State,
  type Card,
  type Grade,
} from "ts-fsrs";

// ใช้พารามิเตอร์ตั้งต้นสำเร็จรูปของ FSRS (ไม่ต้องเทรนเอง ตาม PRD)
const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

export { Rating, State };
export type { Card, Grade };

const KEY = "jrj_fsrs_cards_v1";
export const NEW_PER_SESSION = 10; // แนะนำคำใหม่ต่อรอบ (กันเด้ง 300 คำรวดเดียว)

type CardMap = Record<number, Card>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrate(c: any): Card {
  // JSON แปลง Date เป็น string → แปลงกลับเป็น Date ให้ ts-fsrs ใช้ได้
  return {
    ...c,
    due: new Date(c.due),
    last_review: c.last_review ? new Date(c.last_review) : undefined,
  };
}

export function loadCards(): CardMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: CardMap = {};
    for (const [k, v] of Object.entries(obj)) out[Number(k)] = rehydrate(v);
    return out;
  } catch {
    return {};
  }
}

function saveCards(map: CardMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage เต็ม/ปิด ก็ข้ามไป */
  }
}

export function saveCard(wordId: number, card: Card): void {
  const map = loadCards();
  map[wordId] = card;
  saveCards(map);
}

export function clearCards(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ไม่เป็นไร */
  }
}

// FS-04 (บอลเคาะ 3 ก.ย.): เพดานคิวทวน 40 คำ/วัน — กลับมาหลังหายนานต้องไม่เจอคิวก้อนใหญ่จนท้อ
// ที่เกินเพดานไม่หายไปไหน แค่ทยอยวันถัดไป (เรียงค้างนานสุดก่อนเสมอ)
export const REVIEW_CAP_PER_DAY = 40;

// คิว "ต้องทวนวันนี้": การ์ดที่มีแล้วและถึงกำหนด (due<=now) + คำใหม่จำกัดจำนวน
export function buildQueue(
  allWordIds: number[],
  now: Date = new Date(),
  newLimit: number = NEW_PER_SESSION
): { due: number[]; fresh: number[] } {
  const map = loadCards();
  const due: number[] = [];
  const fresh: number[] = [];
  for (const id of allWordIds) {
    const card = map[id];
    if (!card) {
      if (fresh.length < newLimit) fresh.push(id);
    } else if (card.due.getTime() <= now.getTime()) {
      due.push(id);
    }
  }
  due.sort((a, b) => map[a].due.getTime() - map[b].due.getTime()); // ค้างนานสุดก่อน
  return { due: due.slice(0, REVIEW_CAP_PER_DAY), fresh };
}

// จัดกำหนดใหม่หลังผู้เรียนให้เรตติ้ง แล้วบันทึก
export function review(wordId: number, rating: Grade, now: Date = new Date()): Card {
  const map = loadCards();
  const current = map[wordId] ?? createEmptyCard(now);
  const { card } = scheduler.next(current, now, rating);
  saveCard(wordId, card);
  return card;
}

// พรีวิว "ถ้ากดปุ่มนี้จะทวนอีกครั้งใน..." ทั้ง 4 เรตติ้ง (แบบ Anki)
export function preview(
  wordId: number,
  now: Date = new Date()
): { again: string; hard: string; good: string; easy: string } {
  const map = loadCards();
  const current = map[wordId] ?? createEmptyCard(now);
  const log = scheduler.repeat(current, now);
  return {
    again: intervalText(log[Rating.Again].card, now),
    hard: intervalText(log[Rating.Hard].card, now),
    good: intervalText(log[Rating.Good].card, now),
    easy: intervalText(log[Rating.Easy].card, now),
  };
}

function intervalText(card: Card, now: Date): string {
  const ms = card.due.getTime() - now.getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${Math.max(1, mins)} นาที`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} ชม.`;
  const days = Math.round(hrs / 24);
  return `${days} วัน`;
}

// สถิติภาพรวม (สำหรับหน้าแรก/หน้าผล)
export function fsrsStats(allWordIds: number[], now: Date = new Date()) {
  const map = loadCards();
  let learning = 0;
  let review = 0;
  let dueNow = 0;
  for (const id of allWordIds) {
    const c = map[id];
    if (!c) continue;
    if (c.state === State.Review) review++;
    else learning++;
    if (c.due.getTime() <= now.getTime()) dueNow++;
  }
  return { tracked: learning + review, learning, review, dueNow };
}
