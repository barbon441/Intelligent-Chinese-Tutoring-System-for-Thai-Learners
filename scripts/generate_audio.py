"""generate_audio.py — pre-generate เสียงอ่านคำศัพท์ด้วย edge-tts แล้วอัปขึ้น Supabase Storage

ทำอะไร:
1. ดึงคำจากตาราง words (id, hanzi) ใน Supabase
2. สร้าง mp3 ด้วย edge-tts (เสียงจีนมาตรฐาน, พูดช้าลงนิดสำหรับผู้เริ่มต้น) → เก็บ local ที่ data/audio/
3. อัปขึ้น Supabase Storage bucket 'audio' ที่ path words/{id}.mp3 (สร้าง bucket ให้ถ้ายังไม่มี)
4. อัปเดต words.audio_path

รัน:  python scripts/generate_audio.py
ปลอดภัยรันซ้ำ: ข้ามคำที่มี mp3 local แล้ว + upsert ทับบน storage

ดู docs/08_สเปค-พัฒนา/ARCHITECTURE.md §6
"""

import asyncio
import json
import urllib.request
import urllib.error
from pathlib import Path

import edge_tts
import psycopg

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "data" / "audio" / "words"
VOICE = "zh-CN-XiaoxiaoNeural"   # หญิง เสียงชัด มาตรฐานปักกิ่ง
RATE = "-10%"                     # ช้าลงเล็กน้อย เหมาะผู้เริ่มต้น
BUCKET = "audio"
CONCURRENCY = 8


def load_env() -> dict:
    env = {}
    for line in (ROOT / "apps" / "api" / ".env").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


ENV = load_env()
SUPA_URL = ENV["SUPABASE_URL"].rstrip("/")
SERVICE_KEY = ENV["SUPABASE_SERVICE_ROLE_KEY"]
DB_URL = ENV["SUPABASE_DB_URL"]


def ensure_bucket():
    """สร้าง bucket 'audio' (public) ถ้ายังไม่มี"""
    body = json.dumps({"id": BUCKET, "name": BUCKET, "public": True}).encode()
    req = urllib.request.Request(
        f"{SUPA_URL}/storage/v1/bucket", data=body, method="POST",
        headers={"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY,
                 "Content-Type": "application/json"},
    )
    try:
        urllib.request.urlopen(req, timeout=30)
        print(f"[ok] สร้าง bucket '{BUCKET}' (public)")
    except urllib.error.HTTPError as e:
        msg = e.read().decode()
        if e.code in (400, 409) and "already exists" in msg.lower():
            print(f"[info] bucket '{BUCKET}' มีอยู่แล้ว")
        else:
            raise


def upload(path_in_bucket: str, data: bytes):
    req = urllib.request.Request(
        f"{SUPA_URL}/storage/v1/object/{BUCKET}/{path_in_bucket}", data=data, method="POST",
        headers={"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY,
                 "Content-Type": "audio/mpeg", "x-upsert": "true"},
    )
    urllib.request.urlopen(req, timeout=60)


async def gen_one(sem, wid, hanzi):
    local = AUDIO_DIR / f"{wid}.mp3"
    async with sem:
        try:
            if not (local.exists() and local.stat().st_size > 500):
                c = edge_tts.Communicate(hanzi, VOICE, rate=RATE)
                await c.save(str(local))
            data = local.read_bytes()
            await asyncio.to_thread(upload, f"words/{wid}.mp3", data)
            return (wid, f"words/{wid}.mp3")
        except Exception as e:
            print(f"  [fail] {hanzi} (id={wid}): {e}")
            return None


async def main():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    ensure_bucket()

    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("select id, hanzi from public.words order by id")
            words = cur.fetchall()
    print(f"คำทั้งหมด: {len(words)} — เริ่มสร้าง+อัปเสียง (concurrency={CONCURRENCY}) ...")

    sem = asyncio.Semaphore(CONCURRENCY)
    results = await asyncio.gather(*[gen_one(sem, wid, hz) for wid, hz in words])
    ok = [r for r in results if r]
    print(f"สำเร็จ {len(ok)}/{len(words)}")

    if ok:
        with psycopg.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                cur.executemany("update public.words set audio_path = %s where id = %s",
                                [(p, wid) for wid, p in ok])
            conn.commit()
        print(f"[ok] อัปเดต audio_path แล้ว {len(ok)} แถว")
        print(f"     ตัวอย่าง public URL: {SUPA_URL}/storage/v1/object/public/{BUCKET}/{ok[0][1]}")


if __name__ == "__main__":
    asyncio.run(main())
