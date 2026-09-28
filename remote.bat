@echo off
REM remote.bat - เปิด Remote Control ให้คุยกับ Claude ในโปรเจกต์นี้จากมือถือ/เบราว์เซอร์ (ดับเบิลคลิกเดียว)
REM ใช้ยังไง: ดับเบิลคลิก → รอขึ้น "Connected" → กด space ดู QR → สแกนด้วยแอป Claude (หรือแท็บ Code ในแอป เลือก "xinghang")
REM ห้ามปิดหน้าต่างนี้ระหว่างใช้ · เครื่องต้องเสียบปลั๊ก+ต่อเน็ต · ปิดงาน = Ctrl+C หรือปิดหน้าต่าง
REM เผลอปิดไปแล้วอยากได้ session เดิมคืน (ภายใน 4 ชม.): เปิดเทอร์มินัลที่โฟลเดอร์นี้แล้วรัน  claude remote-control --continue

cd /d "%~dp0"
title Claude Remote Control - xinghang
claude remote-control --name xinghang --spawn=same-dir
pause
