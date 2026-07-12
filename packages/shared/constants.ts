/** ค่าคงที่กลางของจีนรู้ใจ (ฝั่ง TypeScript) — ต้องตรงกับ constants.py เสมอ */

// เกณฑ์คะแนน HSK (มาตรฐานจริง)
export const MAX_SCORE = 200;
export const PASS_SCORE = 120;

// HSK 3.0 (สะสม) — ห้ามใช้ตัวเลขลิสต์ 2.0 เก่า
export const HSK_LEVELS = {
  1: { words: 300, grammar: 48 },
  2: { words: 500, grammar: 129 },
} as const;

export const WORDLIST_VERSION = "HSK3.0-v2026.07";

// ประเภทข้อสอบ (ทุกแบบตรวจด้วย rule เทียบเฉลย — ไม่มี LLM ตรวจ)
export const ITEM_TYPES = [
  "mcq",
  "match",
  "true_false",
  "pick_pinyin",
  "listen_pick_image",
  "word_order",
] as const;

// กลุ่มจุดผิด Thai-L1 หลัก (Knowledge Components)
export const THAI_L1_GROUPS = ["TONE_2_3", "RETROFLEX_ZH_CH_SH_R", "MODIFIER_ORDER"] as const;
