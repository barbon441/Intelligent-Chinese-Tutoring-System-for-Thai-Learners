# db_migrate.py — รันไฟล์ใน supabase/migrations/ ตามลำดับ + จดว่ารันไปแล้วใน public.schema_migrations
# (ทีมไม่มี Supabase CLI — ใช้ตัวนี้แทน · อาจารย์นัดรอบ 7: "แก้ DB ทุกครั้งให้เป็น migration")
#
#   python scripts/db_migrate.py             → dry-run: รันทุกไฟล์ที่ยังไม่ได้รันในทรานแซกชันเดียว แล้ว ROLLBACK (ไม่แตะ DB จริง)
#   python scripts/db_migrate.py --apply     → รันจริงทีละไฟล์ (แต่ละไฟล์ 1 ทรานแซกชัน) แล้วจดเวอร์ชัน
#   python scripts/db_migrate.py --status    → ดูว่าไฟล์ไหนรันแล้ว/ยัง
#   python scripts/db_migrate.py --mark 20260707000001_words 20260707000002_seed_words ...
#                                            → จดว่ารันแล้ว โดยไม่รัน (สำหรับ 0001–0004 ที่เคยรันมือใน SQL Editor)
# ต้องมี SUPABASE_DB_URL (อ่านจาก env หรือ apps/api/.env) · pip install "psycopg[binary]"
import argparse, io, os, re, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIG_DIR = os.path.join(ROOT, "supabase", "migrations")


def db_url():
    url = os.environ.get("SUPABASE_DB_URL")
    if url:
        return url
    env = os.path.join(ROOT, "apps", "api", ".env")
    if os.path.exists(env):
        for line in open(env, encoding="utf-8"):
            if line.startswith("SUPABASE_DB_URL="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("❌ ไม่พบ SUPABASE_DB_URL (ตั้ง env หรือใส่ใน apps/api/.env)")


def strip_tx(sql):
    """ไฟล์อาจมี begin;/commit; ของตัวเอง — ตัดออก เพราะสคริปต์คุมทรานแซกชันเอง"""
    sql = re.sub(r"(?im)^\s*begin\s*;\s*$", "", sql)
    sql = re.sub(r"(?im)^\s*commit\s*;\s*$", "", sql)
    return sql


def migrations():
    files = sorted(f for f in os.listdir(MIG_DIR) if f.endswith(".sql"))
    return [(f[:-4], os.path.join(MIG_DIR, f)) for f in files]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="รันจริง (ไม่ใส่ = dry-run แล้ว rollback)")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--mark", nargs="*", help="จดว่ารันแล้วโดยไม่รัน")
    ap.add_argument("--rerun", help="ลบบันทึกเวอร์ชันนี้แล้วรันไฟล์ใหม่ (ใช้กับ seed ที่ regenerate เช่น 20261007000006_seed_skills_catalog)")
    args = ap.parse_args()

    import psycopg
    conn = psycopg.connect(db_url(), autocommit=False)
    with conn.cursor() as cur:
        cur.execute("""create table if not exists public.schema_migrations (
                         version text primary key, applied_at timestamptz not null default now(), note text)""")
        conn.commit()
        cur.execute("select version from public.schema_migrations")
        done = {r[0] for r in cur.fetchall()}
        cur.execute("show server_version")
        print("Postgres", cur.fetchone()[0])

    all_m = migrations()
    if args.mark is not None:
        with conn.cursor() as cur:
            for v in args.mark:
                cur.execute("insert into public.schema_migrations (version, note) values (%s, %s) on conflict do nothing",
                            (v, "marked manually (เคยรันใน SQL Editor)"))
        conn.commit()
        print("✅ mark:", ", ".join(args.mark))
        return

    if args.rerun:
        path = dict(all_m).get(args.rerun) or sys.exit(f"❌ ไม่พบไฟล์ {args.rerun}.sql")
        try:
            with conn.cursor() as cur:
                cur.execute("delete from public.schema_migrations where version = %s", (args.rerun,))
                cur.execute(strip_tx(open(path, encoding="utf-8").read()))
                cur.execute("insert into public.schema_migrations (version, note) values (%s, 'rerun')", (args.rerun,))
            conn.commit(); print("✅ rerun", args.rerun)
        except Exception as e:
            conn.rollback(); sys.exit(f"❌ {args.rerun} → {e}")
        return

    pending = [(v, p) for v, p in all_m if v not in done]
    if args.status:
        for v, _ in all_m:
            print(("✅ " if v in done else "⬜ ") + v)
        return
    if not pending:
        print("✅ ไม่มี migration ค้าง")
        return

    if not args.apply:
        print(f"🧪 dry-run {len(pending)} ไฟล์ (ROLLBACK ท้ายสุด — DB ไม่เปลี่ยน):")
        try:
            with conn.cursor() as cur:
                for v, p in pending:
                    cur.execute(strip_tx(open(p, encoding="utf-8").read()))
                    print("   ok", v)
                cur.execute("select count(*) from information_schema.tables where table_schema='public'")
                print("   ตารางใน public หลังรัน (ก่อน rollback):", cur.fetchone()[0])
        except Exception as e:
            print("❌", v, "→", e)
            conn.rollback()
            sys.exit(1)
        conn.rollback()
        print("✅ dry-run ผ่าน — รันจริงด้วย --apply")
        return

    for v, p in pending:
        try:
            with conn.cursor() as cur:
                cur.execute(strip_tx(open(p, encoding="utf-8").read()))
                cur.execute("insert into public.schema_migrations (version) values (%s)", (v,))
            conn.commit()
            print("✅ applied", v)
        except Exception as e:
            conn.rollback()
            print("❌", v, "→", e)
            sys.exit(1)
    print("🎉 เสร็จ")


if __name__ == "__main__":
    main()
