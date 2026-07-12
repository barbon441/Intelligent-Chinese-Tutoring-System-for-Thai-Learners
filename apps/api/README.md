# apps/api — จีนรู้ใจ Backend (FastAPI)

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
ใช้ Dockerfile นี้ตรง ๆ — พอร์ต 7860 · ตั้ง secrets ในหน้า Settings ของ Space
