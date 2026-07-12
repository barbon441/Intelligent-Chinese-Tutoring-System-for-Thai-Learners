# ⚙️ SETUP — วิธีเริ่มรันโปรเจกต์ (สำหรับสมาชิกทีม)

## 🔑 ครั้งแรกครั้งเดียว
1. `git pull` (ดึงโค้ดล่าสุด)
2. ขอไฟล์ **`.env` 2 อัน** จากบอลทางแชทส่วนตัว → วางที่:
   - `apps/web/.env.local`
   - `apps/api/.env`
3. ติดตั้งแพ็กเกจ (บอก Claude ในเครื่องว่า *"ช่วย setup ให้รันโปรเจกต์หน่อย"* หรือทำเอง):
   ```
   cd apps/web && npm install
   cd apps/api && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt
   ```

## ▶️ เริ่มทำงาน (ทุกครั้ง)
1. `git pull` ก่อนเสมอ
2. เลือกวิธีรันตามเครื่อง:

### 🖥️ เครื่องแรง (บอล) — รันครบในเครื่อง
- ดับเบิลคลิก `dev.bat` (เปิด API + เว็บ + เบราว์เซอร์ให้เอง)
- ใน `apps/web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`

### 💻 เครื่องช้า (หฤทัย) — รันแค่เว็บ ชี้ API ไปคลาวด์
- รันแค่: `cd apps/web && npm run dev` (ไม่ต้องรัน API!)
- ใน `apps/web/.env.local` เปลี่ยนเป็น:
  ```
  NEXT_PUBLIC_API_URL=https://intelligent-chinese-tutoring-system-for.onrender.com
  ```
- → เบากว่ามาก + ฟีเจอร์ครบ (API อยู่บนคลาวด์)

### 📱 แค่อยากดู/ใช้แอป (ไม่แก้โค้ด)
- รอเรา deploy เว็บ → เปิด URL ในเบราว์เซอร์ได้เลย ไม่ต้องรันอะไร

## 🌐 บริการที่ deploy แล้ว
| ส่วน | ที่ไหน | URL |
|---|---|---|
| API (FastAPI) | Render (ฟรี) | https://intelligent-chinese-tutoring-system-for.onrender.com |
| DB + Storage | Supabase | (ในโปรเจกต์ icts-thai) |
| เว็บ (Next.js) | ยังไม่ deploy (รันในเครื่อง) | — |

> ⚠️ API บน Render ฟรี **หลับหลัง 15 นาทีไม่มีคนใช้** → เรียกครั้งแรกช้า ~30-50 วิ (ปลุกเซิร์ฟเวอร์) แล้วค่อยเร็ว
> ⚠️ push โค้ดฝั่ง `apps/api/` → Render auto-deploy เอง (~3-5 นาที)

## ⏹️ เลิกงาน
- ปิดหน้าต่าง API/WEB (ถ้าเปิด) + บอก Claude *"เก็บงาน push"*
