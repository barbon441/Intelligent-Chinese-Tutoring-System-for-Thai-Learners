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

echo [3/3] รอเว็บพร้อม (เช็กพอร์ต 3000 ทุก 3 วิ) ...
:waitloop
timeout /t 3 /nobreak >nul
powershell -NoProfile -Command "if (Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo    ยังไม่พร้อม รออีกนิด...
  goto waitloop
)

echo    เว็บพร้อมแล้ว! เปิดเบราว์เซอร์ ...
start http://localhost:3000

echo.
echo เปิดเรียบร้อย! ปิดงาน = ปิดหน้าต่าง API + WEB ที่เด้งขึ้นมา
pause
