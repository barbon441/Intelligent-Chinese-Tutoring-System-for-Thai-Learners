// พินอินระบายสีตามวรรณยุกต์ — จุดสวยเฉพาะตัว + ช่วยแยกเสียง 2/3 (จุดพลาด Thai-L1)
import { splitSyllables, toneOf } from "@/lib/pinyin-tone";

const TONE_CLASS = ["", "text-tone1", "text-tone2", "text-tone3", "text-tone4", "text-tone5"];

export function Pinyin({ text, className }: { text: string; className?: string }) {
  const syllables = splitSyllables(text);
  return (
    <span className={className}>
      {syllables.map((s, i) => (
        <span key={i} className={TONE_CLASS[toneOf(s)]}>
          {s}
          {i < syllables.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
