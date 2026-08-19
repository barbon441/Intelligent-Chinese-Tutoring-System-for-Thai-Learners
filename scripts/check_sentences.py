# -*- coding: utf-8 -*-
"""check_sentences.py — ยามเฝ้าประตูคลังประโยค (กฎ PA-07/CG-05: 0 คำนอกลิสต์ระดับ)

ตรวจว่าประโยคทุกประโยคใช้เฉพาะคำใน HSK 3.0 ระดับที่กำหนด
- ประโยคที่แบ่งคำแล้ว (tokens ใน sentences.ts) → เทียบตรงกับคลังคำ
- ข้อความจีนดิบ (อาร์กิวเมนต์บรรทัดคำสั่ง) → ตัดคำด้วย jieba ก่อนแล้วค่อยเทียบ

รัน:  python scripts/check_sentences.py                    # ตรวจ sentences.ts ทั้งไฟล์
      python scripts/check_sentences.py "我喜欢猫"          # ตรวจข้อความดิบ (ต้องมี jieba — อยู่ใน venv ของ api)
ออก:  exit 0 = ผ่านหมด · exit 1 = มีคำนอกลิสต์ (ห้ามเอาเข้า item bank)
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORDLIST = ROOT / "data" / "wordlist" / "hsk30-level1-v2026.07.json"
SENTENCES_TS = ROOT / "apps" / "web" / "src" / "data" / "sentences.ts"


def load_allowed(loose: bool = False) -> set[str]:
    """loose=False (ค่าเริ่มต้น): เทียบทั้งคำตรง ๆ — ใช้กับประโยคที่แบ่งคำแล้ว
    loose=True: อนุโลมตัวอักษรเดี่ยวที่เป็นส่วนของคำในลิสต์ — ใช้เฉพาะโหมด jieba
    (เพราะ jieba อาจตัดคำละเอียดกว่าลิสต์ เช่น 一个 → 一/个) — เข้มไว้ก่อน หลวมเฉพาะที่จำเป็น"""
    data = json.loads(WORDLIST.read_text(encoding="utf-8"))
    words = data if isinstance(data, list) else data.get("words", [])
    allowed = {w["hanzi"] for w in words}
    if loose:
        for w in list(allowed):
            for ch in w:
                allowed.add(ch)
    return allowed


def check_tokens(tokens: list[str], allowed: set[str]) -> list[str]:
    return [t for t in tokens if t not in allowed]


def parse_sentences_ts() -> list[tuple[int, list[str]]]:
    src = SENTENCES_TS.read_text(encoding="utf-8")
    out = []
    for m in re.finditer(r"id:\s*(\d+),\s*tokens:\s*\[([^\]]*)\]", src):
        sid = int(m.group(1))
        tokens = re.findall(r'"([^"]+)"', m.group(2))
        out.append((sid, tokens))
    return out


def main() -> int:
    bad_total = 0

    raw_args = [a for a in sys.argv[1:] if a.strip()]
    allowed = load_allowed(loose=bool(raw_args))
    if raw_args:
        try:
            import jieba  # noqa: F401 — ใช้เมื่อรับข้อความดิบเท่านั้น
        except ImportError:
            print("ต้องมี jieba สำหรับข้อความดิบ — รันผ่าน venv ของ api: apps/api/.venv/Scripts/python.exe")
            return 2
        for text in raw_args:
            tokens = [t for t in jieba.cut(text) if re.match(r"[一-鿿]", t)]
            bad = check_tokens(tokens, allowed)
            status = "PASS" if not bad else f"FAIL นอกลิสต์: {' '.join(bad)}"
            print(f"[{status}] {text}  →  {' / '.join(tokens)}")
            bad_total += len(bad)
        return 0 if bad_total == 0 else 1

    sentences = parse_sentences_ts()
    if not sentences:
        print("อ่าน sentences.ts ไม่เจอประโยคเลย — เช็ก path/รูปแบบไฟล์")
        return 2
    for sid, tokens in sentences:
        bad = check_tokens(tokens, allowed)
        if bad:
            print(f"[FAIL] ประโยค #{sid}: คำนอกลิสต์ HSK1 → {' '.join(bad)}   (ทั้งประโยค: {''.join(tokens)})")
            bad_total += len(bad)
        else:
            print(f"[PASS] ประโยค #{sid}: {''.join(tokens)}")
    print()
    if bad_total:
        print(f"สรุป: พบคำนอกลิสต์ {bad_total} จุด — ตามกฎ CG-05 ห้ามเสิร์ฟจนกว่าจะแก้/เปลี่ยนคำ")
    else:
        print("สรุป: ผ่านทุกประโยค (0 คำนอกลิสต์)")
    return 0 if bad_total == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
