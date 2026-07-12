"""จีนรู้ใจ API — FastAPI backend (scaffold M1)

รันในเครื่อง:  uvicorn app.main:app --reload --port 8000
บน HF Spaces: Dockerfile รันที่พอร์ต 7860 อัตโนมัติ
เอกสาร API:   เปิด /docs (Swagger UI สร้างให้เอง)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="จีนรู้ใจ API",
    description="Backend ของติวเตอร์เตรียมสอบ HSK 1-2 สำหรับคนไทย — pyBKT · FSRS · Thai-L1 diagnosis",
    version="0.1.0",
)

# CORS: ช่วง dev เปิดกว้างไว้ก่อน — ตอน deploy จริงให้จำกัดเป็นโดเมนของเว็บเรา
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"app": "จีนรู้ใจ (中文知心)", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health():
    """ใช้เช็กว่า API ตื่นอยู่ — และเป็นปลายทางของ keepalive ping"""
    return {"status": "ok", "service": "jeen-roo-jai-api", "version": "0.1.0"}


# ── โครงโมดูลตาม ARCHITECTURE.md §3 (จะเติมจริงใน M2-M5) ──────────────
# routers/items.py         → GET /items, /items/{id}
# routers/attempts.py      → POST /attempts/batch (idempotent ด้วย client_attempt_id)
# routers/learner_model.py → GET /mastery (pyBKT posterior)
# routers/scheduler.py     → GET /review-queue (py-fsrs)
# routers/diagnosis.py     → GET /diagnosis (Thai-L1)
# routers/mock_exam.py     → POST /mock-exam/start|submit (สเกล 200 ผ่าน 120)
