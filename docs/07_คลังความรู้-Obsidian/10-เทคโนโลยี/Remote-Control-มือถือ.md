---
tags: [เทคโนโลยี, เครื่องมือ, claude-code, remote]
updated: 2026-09-28
---

# Remote Control — คุยกับ Claude ในโปรเจกต์นี้จากมือถือ

> ใช้ครั้งแรก 28 ก.ย. 2026 · ทำงานได้ครบ (อ่านไฟล์ / แก้ไฟล์ / git / ตรวจเครื่อง) · ข้อจำกัดเดียวคือคอมต้องเปิดค้างไว้

## วิธีใช้
1. ที่คอม ดับเบิลคลิก `remote.bat` (root ของ repo) → รัน `claude remote-control --name xinghang --spawn=same-dir`
2. รอขึ้น Connected → กด space ดู QR → สแกนด้วยแอป Claude (หรือแท็บ Code ในแอป เลือก "xinghang")
3. ห้ามปิดหน้าต่างนี้ระหว่างใช้
4. หลุดแล้วอยากได้ session เดิมคืน (ภายใน 4 ชม.): เปิดเทอร์มินัลที่โฟลเดอร์นี้ → `claude remote-control --continue`

## เครื่องต้องไม่หลับ — สิ่งที่ตรวจแล้ว 28 ก.ย.
เครื่อง: Lenovo 83DG (LAPTOP-4JTEHQJS) · Windows 11 Home · รองรับ Standby S3 (ไม่ใช่ Modern Standby)

| ค่า | ตอนนี้ | ผลต่อ Remote |
|---|---|---|
| Sleep after (เสียบสาย / แบต) | Never / Never | ✅ ไม่หลับเอง |
| Hibernate after | Never / Never | ✅ |
| หน้าจอดับ | Never / Never | จอไม่ดับ เปลืองแบต — ตั้ง 5–10 นาทีได้ ไม่กระทบ Remote |
| **พับฝา** | หลับ / หลับ | ⚠️ พับฝา = หลุดทันที |
| **ปุ่ม power** | หลับ / หลับ | ⚠️ เผลอกด = หลุด |
| unattended sleep (ค่าซ่อน) | default 2 นาที | ทำงานเฉพาะหลังตื่นจากที่ไม่ใช่คนกด — ไม่กระทบถ้าไม่หลับตั้งแต่แรก |

**บทเรียน 28 ก.ย.:** เครื่องหลับ 06:46 ทั้งที่ "ตั้งไม่หลับแล้ว" — จริง ๆ ค่า Never ครบทั้ง 2 โหมดถูกเขียนตอน 06:48:44 (หลังหลับ) · ตอนหลับเครื่องอยู่บนแบตเพราะสายหลุด 06:39 · ค่าที่แก้ตอน 05:50 ยังไม่ครอบคลุมโหมดแบต · **Remote Control ไม่นับเป็น "การใช้งาน" ในสายตา Windows** (ไม่มีคีย์บอร์ด/เมาส์ที่ตัวเครื่อง) ดังนั้นต้องตั้ง Never จริง ๆ ทั้ง 2 โหมด

**แก้พับฝาให้ไม่หลับ (ยังไม่ได้รัน — รอบอลสั่ง):**
```
powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setdcvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setactive SCHEME_CURRENT
```

**วิธีตรวจว่าทำไมหลับ (ใช้ซ้ำได้):**
```powershell
Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Microsoft-Windows-Kernel-Power'; Id=42} -MaxEvents 5 | Format-List TimeCreated, Message
# Sleep Reason: System Idle = หมดเวลา · Button or Lid = พับฝา/กดปุ่ม · Application API = โปรแกรมสั่ง
powercfg /query SCHEME_CURRENT SUB_SLEEP    # ดูค่า Sleep after (0 = Never)
```

## ข้อควรรู้อื่น
- ปิดเครื่องจากมือถือได้ (`shutdown /s`) แต่**เปิดกลับจากมือถือไม่ได้** ต้องกดที่เครื่อง
- Lock หน้าจอไม่กระทบ Remote · Sleep/Shutdown กระทบ
- `rtk` (ตัวย่อ output ใน CLAUDE.md global) ไม่มีในเครื่องนี้ → AI ใช้ git ตรง

เกี่ยวข้อง: [[2026-09-28]] · [[โฮสติ้งฟรี]]
