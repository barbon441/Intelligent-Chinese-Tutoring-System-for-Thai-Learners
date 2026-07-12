// อ่านวรรณยุกต์จากพินอิน (จาก tone mark บนสระ) — สำหรับระบายสีพินอิน
// ข้อมูลพินอินของเราเว้นวรรคต่อพยางค์ (เช่น "lǎo shī") → แยกด้วยช่องว่างได้เลย

const TONE_MARKS: Record<string, number> = {
  ā: 1, ē: 1, ī: 1, ō: 1, ū: 1, ǖ: 1,
  á: 2, é: 2, í: 2, ó: 2, ú: 2, ǘ: 2,
  ǎ: 3, ě: 3, ǐ: 3, ǒ: 3, ǔ: 3, ǚ: 3,
  à: 4, è: 4, ì: 4, ò: 4, ù: 4, ǜ: 4,
};

/** วรรณยุกต์ของ 1 พยางค์ (1-4 ตาม mark, ไม่มี mark = 5 เสียงเบา) */
export function toneOf(syllable: string): number {
  for (const ch of syllable) {
    const t = TONE_MARKS[ch];
    if (t) return t;
  }
  return 5;
}

/** แยกพินอินเป็นพยางค์ (ตามช่องว่าง) */
export function splitSyllables(pinyin: string): string[] {
  return pinyin.trim().split(/\s+/).filter(Boolean);
}
