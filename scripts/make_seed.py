"""make_seed.py — แปลง wordlist JSON เป็นไฟล์ SQL seed สำหรับ Supabase

รัน:   python scripts/make_seed.py
ได้:   data/seeds/002_seed_words.sql  (รันซ้ำได้ — ON CONFLICT อัปเดตทับ)
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "wordlist" / "hsk30-level1-v2026.07.json"
OUT = ROOT / "data" / "seeds" / "002_seed_words.sql"


def q(s: str) -> str:
    """escape single quote สำหรับ SQL string literal"""
    return (s or "").replace("'", "''")


def main():
    words = json.loads(SRC.read_text(encoding="utf-8"))
    lines = [
        "-- 002_seed_words.sql — seed คำศัพท์ HSK 1 (300 คำ) · สร้างโดย scripts/make_seed.py",
        "-- รันหลัง 001_create_words.sql ใน Supabase SQL Editor · รันซ้ำได้ (upsert)",
        "",
    ]
    for w in words:
        pos = "ARRAY[" + ",".join(f"'{q(p)}'" for p in w.get("pos", [])) + "]::text[]" if w.get("pos") else "'{}'::text[]"
        men = q(json.dumps(w.get("meaning_en", []), ensure_ascii=False))
        lines.append(
            "insert into public.words (hanzi, traditional, pinyin, pos, meaning_en, meaning_th, th_reviewed, hsk_level, wordlist_version, category) values "
            f"('{q(w['hanzi'])}', '{q(w.get('traditional', ''))}', '{q(w['pinyin'])}', {pos}, '{men}'::jsonb, "
            f"'{q(w.get('meaning_th', ''))}', {str(bool(w.get('th_reviewed'))).lower()}, {int(w['hsk_level'])}, '{q(w['wordlist_version'])}', {int(w['category']) if w.get('category') else 'null'}) "
            "on conflict (hanzi) do update set traditional = excluded.traditional, pinyin = excluded.pinyin, "
            "pos = excluded.pos, meaning_en = excluded.meaning_en, meaning_th = excluded.meaning_th, "
            "th_reviewed = excluded.th_reviewed, hsk_level = excluded.hsk_level, wordlist_version = excluded.wordlist_version, category = excluded.category;"
        )
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"✅ สร้าง {OUT.name}: {len(words)} แถว")


if __name__ == "__main__":
    main()
