---
title: 星航 API
emoji: 🐉
colorFrom: blue
colorTo: pink
sdk: docker
app_port: 7860
pinned: false
---

# apps/api — 星航 Backend (FastAPI)

> frontmatter ข้างบนเป็น config ของ Hugging Face Space (Docker SDK) — HF อ่านตอน deploy

## รันในเครื่อง
```
cd apps/api
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
เปิด http://localhost:8000/docs (Swagger) · /health (เช็กสถานะ)

## Deploy: Hugging Face Spaces (Docker SDK)
- ใช้ Dockerfile นี้ตรง ๆ — พอร์ต 7860
- ตั้ง secrets ในหน้า Settings → Variables and secrets ของ Space:
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`
- ห้าม commit `.env` — ค่าจริงอยู่ใน HF secrets เท่านั้น
