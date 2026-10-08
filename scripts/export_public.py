# export_public.py — คัดลอก "โค้ด + ดีไซน์ DB" จาก repo หลัก (workspace) ไป repo สะอาดสำหรับอาจารย์/กรรมการ
#
#   python scripts/export_public.py --out ../hsk-tutor-for-thai                 → คัดไฟล์ + เขียน README (ไม่แตะ git)
#   python scripts/export_public.py --out ../hsk-tutor-for-thai --push https://github.com/<user>/hsk-tutor-for-thai.git
#                                                                              → + git init/commit/push (สร้าง branch main)
#
# หลักการ: เดินตาม `git ls-files` ของ repo หลักเท่านั้น (ไฟล์ที่ .gitignore กันไว้ เช่น .env จึงไม่มีทางหลุด)
#          แล้วกรองด้วย INCLUDE/EXCLUDE ข้างล่าง · เอกสารส่วนตัวของทีม (docs/03 คลิป/วิเคราะห์ · docs/07 vault · .claude ฯลฯ) ไม่ไป
#          ทิศทางเดียว: หลัก → สะอาด · ถ้าอาจารย์แก้ใน repo สะอาด ให้ดึงกลับด้วย git cherry-pick (path ตรงกัน)
import argparse, io, os, shutil, subprocess, sys, datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D08 = "docs/08_สเปค-พัฒนา/"

# โฟลเดอร์/ไฟล์ที่ไปทั้งก้อน (path เดิม)
INCLUDE_PREFIX = ("apps/", "supabase/", "scripts/", "data/", "packages/", "ml/")   # .github/keepalive ไม่ไป (ผูกกับ vars ของ repo หลัก)
INCLUDE_FILES = {"package.json", "dev.bat", ".gitignore"}
# ยกเว้นในก้อนข้างบน
EXCLUDE_PREFIX = ("scripts/export_public.py",)          # สคริปต์นี้ไม่ต้องไปด้วย
# docs: เลือกทีละไฟล์ + เปลี่ยนชื่อปลายทาง (ตัด 星航 ออกจากชื่อไฟล์ — repo ทางการไม่ใช้ชื่อคอนเซปต์)
DOCS_MAP = {
    D08 + "er-drawio.sql":                              "docs/db/er-drawio.sql",
    D08 + "DATABASE-ER.md":                             "docs/db/DATABASE-ER.md",
    D08 + "ER-星航.drawio":                              "docs/db/ER-full.drawio",
    D08 + "ER-เดินตามผู้ใช้-星航.drawio":                 "docs/db/ER-walkthrough.drawio",
    D08 + "ตารางแบบอาจารย์-หมวด1.md":                   "docs/db/ตารางหมวด1-ทักษะ-เนื้อหา-ข้อสอบ-ผล.md",
    D08 + "query-ตรวจสอบข้อมูล.sql":                    "docs/db/query-ตรวจสอบข้อมูล.sql",
    D08 + "ARCHITECTURE.md":                            "docs/spec/ARCHITECTURE.md",
    D08 + "PRD.md":                                     "docs/spec/PRD.md",
    D08 + "กฎการทำงานระบบ-BUSINESS-RULES.md":           "docs/spec/กฎการทำงานระบบ-BUSINESS-RULES.md",
    D08 + "โมดูล-ฟังก์ชัน-สเปค.md":                      "docs/spec/โมดูล-ฟังก์ชัน-สเปค.md",
    D08 + "โฟลว์ผู้ใช้-สิทธิ์แอดมิน.md":                  "docs/spec/โฟลว์ผู้ใช้-สิทธิ์แอดมิน.md",
    D08 + "ความต้องการข้อมูล-User-Journey.md":           "docs/spec/ความต้องการข้อมูล-User-Journey.md",
    D08 + "กรอบระบบ-CHECKLIST.md":                      "docs/spec/กรอบระบบ-CHECKLIST.md",
    D08 + "กรอบการสอน-การประเมิน-ONE-PAGER.md":          "docs/spec/กรอบการสอน-การประเมิน-ONE-PAGER.md",
    D08 + "ออกแบบทักษะ-ฟัง-อ่าน-เขียน.md":                "docs/content/ออกแบบทักษะ-ฟัง-อ่าน-เขียน.md",
    D08 + "ออกแบบ-แผนเรียนวินิจฉัยนำทาง.md":             "docs/content/ออกแบบ-แผนเรียนวินิจฉัยนำทาง.md",
    D08 + "แผนการเรียน-HSK1.md":                        "docs/content/แผนการเรียน-HSK1.md",
    D08 + "แผนคอนเทนต์-เนื้อหาสอน.md":                   "docs/content/แผนคอนเทนต์-เนื้อหาสอน.md",
    D08 + "ลำดับการสอน-อิงตำรา.md":                      "docs/content/ลำดับการสอน-อิงตำรา.md",
}
import re
# รูปแบบความลับ "ของจริง" (ไม่ใช่ placeholder ใน .env.example / คำว่า hsk-) — เจอแล้วหยุด ไม่ push
SECRET_PATTERNS = (
    re.compile(r"SUPABASE_SERVICE_ROLE_KEY=\s*eyJ[A-Za-z0-9_\-]{20,}"),   # service key จริง (JWT)
    re.compile(r"\beyJhbGciOi[A-Za-z0-9_\-]{30,}\.[A-Za-z0-9_\-]{20,}"),  # JWT ใด ๆ
    re.compile(r"(?<![A-Za-z0-9])sk-[A-Za-z0-9]{20,}"),                   # OpenAI-style key
    re.compile(r"AIza[0-9A-Za-z_\-]{30,}"),                              # Google API key (Gemini)
    re.compile(r"postgres(?:ql)?://[^:\s]+:[^@\s]{4,}@"),                 # connection string มีรหัสผ่าน
    re.compile(r"BEGIN (?:RSA |EC )?PRIVATE KEY"),
)

README = """# ระบบติวเตอร์ภาษาจีนอัจฉริยะสำหรับคนไทย
## Intelligent Chinese Tutoring System for Thai Learners (HSK 1–2)

โปรเจกต์จบ สาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้ ปีการศึกษา 2569
- นายวรเดช ปิ่นทอง (6604101376) — ระบบ/ฐานข้อมูล/deploy
- นางสาวหฤทัย ยุวรัตน์ (6604101407) — เนื้อหาภาษาจีน/ข้อสอบ/คลังจุดผิดคนไทย

เว็บแอป (PWA) ช่วยคนไทยที่เริ่มจากศูนย์เตรียมสอบ HSK 1–2 โดย **วินิจฉัยจุดที่คนไทยมักพลาด** (วรรณยุกต์ 2/3 · เสียง zh/ch/sh · ไวยากรณ์ถ่ายโอนจากไทย)
แล้วติวเจาะจุดนั้น · วัดความแม่นรายทักษะด้วย Bayesian Knowledge Tracing (pyBKT) · นัดทวนด้วย FSRS · ตรวจคำตอบด้วยกฎเทียบเฉลย (ไม่ใช้ LLM ตรวจ)

## โครงสร้าง
| โฟลเดอร์ | คืออะไร |
|---|---|
| `apps/web/` | Next.js (PWA) — หน้าเรียน/ฝึก/ควิซ/pre-post · deploy บน Vercel |
| `apps/api/` | FastAPI — pyBKT · FSRS · ตรวจข้อ · deploy บน Render |
| `supabase/migrations/` | **ฐานข้อมูล 24 ตาราง เป็นโค้ด** (schema + RLS + trigger + seed) — รันด้วย `python scripts/db_migrate.py` |
| `docs/db/` | ดีไซน์ฐานข้อมูล: `er-drawio.sql` (ต้นทางของผัง) · `ER-walkthrough.drawio` (ผังแผ่นเดียวเดินตามผู้ใช้) · `ER-full.drawio` · `DATABASE-ER.md` · ตารางหมวด 1 (หมวด → ทักษะ → เนื้อหา → ข้อสอบ → ผล) |
| `docs/spec/` | PRD · สถาปัตยกรรม · กฎการทำงานระบบ · โฟลว์ผู้ใช้ · โมดูล/ฟังก์ชัน |
| `docs/content/` | แผนเนื้อหา/ทักษะ/ลำดับการสอน (อิงตำรา HSK) |
| `data/` | คำศัพท์ HSK1 300 คำ (seed) · คลังจุดผิดคนไทย (`thai-l1/catalog-v1.json`) |
| `scripts/` | สร้างผัง ER จาก SQL · migration · เสียง TTS · seed |

## รันในเครื่อง
```bash
# เว็บ
cd apps/web && npm install && npm run dev          # http://localhost:3000
# API
cd apps/api && python -m venv .venv && .venv\\Scripts\\activate && pip install -r requirements.txt && uvicorn app.main:app --reload
# ฐานข้อมูล (Supabase Postgres) — ใส่ SUPABASE_DB_URL ใน apps/api/.env แล้ว
python scripts/db_migrate.py            # dry-run (rollback) · --apply รันจริง · --status
```
ต้องมีไฟล์ `apps/web/.env.local` และ `apps/api/.env` (ขอจากทีม — ไม่อยู่ใน repo)

## ฐานข้อมูล (สำหรับอาจารย์ที่ปรึกษา)
เดินตามผู้ใช้: สมัคร (`users`) → pre-test (`exam_forms` → `form_items` → `items` · ผลรอบ `sessions` · คำตอบรายข้อ `attempts`) → เรียนตามหมวด (`categories` · `category_progress` · `words` · `review_states` · `sentences` · `sentence_words` · `sentence_states`) → ปูพื้นฐานเสียง (`foundation_*` · `minimal_pairs`) → สมอง (`bkt_training_runs` · `skills` · `mastery_snapshots` · `thai_l1_catalog`)
- เริ่มอ่านที่ `docs/db/ตารางหมวด1-ทักษะ-เนื้อหา-ข้อสอบ-ผล.md` แล้วเปิด `docs/db/ER-walkthrough.drawio` ใน draw.io
- แก้โครง = แก้ `docs/db/er-drawio.sql` → ออกไฟล์ใหม่ใน `supabase/migrations/` (ไม่แก้ตารางมือ)

---
_synced from team workspace @ {sha} · {date}_
"""


def sh(args, cwd):
    return subprocess.run(args, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="โฟลเดอร์ปลายทาง (repo สะอาด)")
    ap.add_argument("--push", help="URL remote ของ repo สะอาด — ถ้าใส่จะ git init/commit/push ให้")
    args = ap.parse_args()
    out = os.path.abspath(args.out)

    files = sh(["git", "ls-files", "-z"], ROOT).stdout.split("\0")
    files = [f for f in files if f]
    sha = sh(["git", "rev-parse", "--short", "HEAD"], ROOT).stdout.strip()
    today = datetime.date.today().isoformat()

    plan = {}
    for f in files:
        if f in DOCS_MAP:
            plan[f] = DOCS_MAP[f]
        elif f.startswith(EXCLUDE_PREFIX):
            continue
        elif f.startswith(INCLUDE_PREFIX) or f in INCLUDE_FILES:
            plan[f] = f
    missing = [k for k in DOCS_MAP if k not in files]
    if missing:
        print("⚠️ ไฟล์ใน DOCS_MAP ที่ไม่พบใน git:", missing)

    # ล้างปลายทาง (เว้น .git) แล้วคัดลอก
    os.makedirs(out, exist_ok=True)
    for name in os.listdir(out):
        if name == ".git":
            continue
        p = os.path.join(out, name)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
    for src, dst in plan.items():
        s, d = os.path.join(ROOT, src), os.path.join(out, dst)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        shutil.copy2(s, d)
    open(os.path.join(out, "README.md"), "w", encoding="utf-8", newline="\n").write(README.replace("{sha}", sha).replace("{date}", today))

    # ตรวจความลับ + รอยอ้างถึงของส่วนตัว
    hits, private_refs = [], 0
    for dst in list(plan.values()) + ["README.md"]:
        p = os.path.join(out, dst)
        try:
            txt = open(p, encoding="utf-8", errors="ignore").read()
        except Exception:
            continue
        for pat in SECRET_PATTERNS:
            if pat.search(txt):
                hits.append((dst, pat.pattern[:40]))
        private_refs += txt.count("07_คลังความรู้") + txt.count("03_บันทึก-แผนงาน")
    skipped = len(files) - len(plan)
    print(f"✅ export {len(plan)} ไฟล์ → {out}  (ข้าม {skipped} ไฟล์ส่วนตัว/ไม่เกี่ยว) · จาก workspace @ {sha}")
    print(f"   ลิงก์ที่ชี้ไปเอกสารส่วนตัว (ไม่ได้ไปด้วย ลิงก์จะตาย ไม่เป็นไร): {private_refs} จุด")
    if hits:
        print("❌ พบรูปแบบความลับ — หยุดก่อน:", hits)
        sys.exit(1)

    if args.push:
        if not os.path.isdir(os.path.join(out, ".git")):
            print(sh(["git", "init", "-b", "main"], out).stdout.strip())
        sh(["git", "add", "-A"], out)
        r = sh(["git", "commit", "-q", "-m", f"sync from team workspace @ {sha} ({today})"], out)
        print("commit:", (r.stdout + r.stderr).strip()[:200] or "ok")
        remotes = sh(["git", "remote"], out).stdout.split()
        if "origin" not in remotes:
            sh(["git", "remote", "add", "origin", args.push], out)
        r = sh(["git", "push", "-u", "origin", "main"], out)
        print("push:", (r.stdout + r.stderr).strip()[-300:])


if __name__ == "__main__":
    main()
