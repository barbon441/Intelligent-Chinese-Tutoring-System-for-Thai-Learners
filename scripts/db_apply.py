"""db_apply.py — รันไฟล์ SQL กับฐานข้อมูล Supabase ของโปรเจกต์

ใช้ SUPABASE_DB_URL จาก apps/api/.env (Session pooler connection string)
รัน:  python scripts/db_apply.py data/seeds/001_create_words.sql [ไฟล์ต่อไป...]
"""

import sys
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parent.parent


def load_db_url() -> str:
    env = ROOT / "apps" / "api" / ".env"
    for line in env.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("SUPABASE_DB_URL="):
            url = line.split("=", 1)[1].strip()
            if url:
                return url
    raise SystemExit("ไม่พบ SUPABASE_DB_URL ใน apps/api/.env")


def main():
    files = sys.argv[1:]
    if not files:
        raise SystemExit("ระบุไฟล์ SQL อย่างน้อย 1 ไฟล์")
    url = load_db_url()
    with psycopg.connect(url) as conn:
        for f in files:
            sql = (ROOT / f).read_text(encoding="utf-8")
            print(f"▶ รัน {f} ...")
            with conn.cursor() as cur:
                cur.execute(sql)
            conn.commit()
            print(f"  ✅ สำเร็จ")
        # สรุปจำนวนแถวในตาราง words (ถ้ามี)
        try:
            with conn.cursor() as cur:
                cur.execute("select count(*), count(*) filter (where meaning_th <> '') from public.words")
                total, with_th = cur.fetchone()
                print(f"📊 ตาราง words: {total} แถว (มีคำแปลไทย {with_th})")
                cur.execute("select hanzi, pinyin, meaning_th from public.words order by id limit 3")
                for r in cur.fetchall():
                    print("   ", r)
        except Exception:
            pass


if __name__ == "__main__":
    main()
