@echo off
REM dev.bat - เปิดเซิร์ฟเวอร์ทั้ง 2 ฝั่ง (API + เว็บ) + เบราว์เซอร์ ด้วยดับเบิลคลิกเดียว
REM ปิดงาน: ปิดหน้าต่าง 2 อันที่เด้งขึ้นมา (จีนรู้ใจ-API / จีนรู้ใจ-WEB)

echo ========================================
echo   จีนรู้ใจ - เปิดเซิร์ฟเวอร์พัฒนา
echo ========================================

echo [1/3] เปิด API (FastAPI) ...
start "จีนรู้ใจ-API" cmd /k "cd /d %~dp0apps\api && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [2/3] เปิดเว็บ (Next.js) ...
start "จีนรู้ใจ-WEB" cmd /k "cd /d %~dp0apps\web && npm run dev"

echo [3/3] รอเว็บพร้อม แล้วเปิดเบราว์เซอร์ ...
timeout /t 18 /nobreak >nul
start http://localhost:3000

echo.
echo เปิดแล้ว! ถ้าเบราว์เซอร์ยังว่าง รออีก 10 วิ แล้วรีเฟรช (F5)
echo ปิดงาน = ปิดหน้าต่าง API + WEB ที่เด้งขึ้นมา
pause
