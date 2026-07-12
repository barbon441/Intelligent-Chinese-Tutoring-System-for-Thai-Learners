# จีนรู้ใจ API — สำหรับ deploy บน Hugging Face Spaces (Docker SDK)
# HF Spaces เสิร์ฟที่พอร์ต 7860 · secrets ตั้งในหน้า Settings ของ Space (ห้าม hardcode)

FROM python:3.11-slim

WORKDIR /code

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# HF Spaces ใช้ user ที่ไม่ใช่ root
RUN useradd -m appuser
USER appuser

EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
