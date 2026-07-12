# แผนโปรเจกต์: ผู้ช่วย AI ส่วนบุคคลบน LINE (LINE Personal AI Assistant)

> **เอกสารนี้คืออะไร:** สรุปแผนโปรเจกต์จบ (senior project) ฉบับสมบูรณ์ สำหรับนำไปทำงานต่อในเครื่อง/เครื่องมือ AI อื่น
> **ผู้จัดทำ:** บอล — นักศึกษาวิทยาการคอมพิวเตอร์ ปี 4 มหาวิทยาลัยแม่โจ้
> **ระยะเวลา:** 4 เดือน (เริ่ม ~มิ.ย. 2026 → เดดไลน์ ~ปลาย ต.ค. 2026)
> **อัปเดตล่าสุด:** 2026-06-24

---

## 0. TL;DR (สรุปใน 30 วินาที)

สร้าง **ผู้ช่วย AI ส่วนบุคคลบน LINE สำหรับคนทำงานไทย** ที่:
1. **จำบริบทการคุยได้** (ความจำคล้ายมนุษย์ + RAG)
2. **เก็บไฟล์ไม่ให้หมดอายุ** (File Vault — ฟีเจอร์เด่น แก้ปัญหาจริงของ LINE)
3. **สรุปแชต** ให้อัตโนมัติ
4. เปิดความจำผ่าน **MCP** ให้ AI ตัวอื่น (Claude/ChatGPT) มาใช้ได้

**แก่นวิชาการ** = Memory Engine (สกัดข้อเท็จจริง + ลืมแบบมนุษย์ + ค้นคืนแบบผสม + รองรับภาษาไทย) ที่ **วัดผลด้วย benchmark + ablation study**

ทำได้ด้วยงบ **~0 บาท** (ใช้ free tier ทั้งหมด)

---

## 1. ภาพรวม & วิสัยทัศน์ (Vision)

ชื่อโครงงาน:
- **ไทย:** ผู้ช่วยปัญญาประดิษฐ์ส่วนบุคคลบนแพลตฟอร์ม LINE ที่มีระบบความจำคล้ายมนุษย์และคลังเก็บไฟล์อัจฉริยะ
- **อังกฤษ:** LINE Personal AI Assistant with Human-like Memory and an Intelligent File Vault

แนวคิดสถาปัตยกรรมหลัก: **"สร้างสมองครั้งเดียว เปิดได้หลายช่องทาง" (Build the brain once, expose it many ways)**
- สมอง = Core Memory Engine (สร้างเอง = ส่วนที่ได้คะแนน/ความว้าว)
- ช่องทาง = LINE (ผู้ใช้ทั่วไป) + MCP server (ให้ AI อื่นใช้)

---

## 2. ปัญหา & แรงจูงใจ (ข้อมูลตรวจสอบแล้ว)

- **LINE ครองตลาดไทย:** ~54-56 ล้านผู้ใช้ (~80% ประชากร) เป็นเครื่องมือทำงานหลัก โดยเฉพาะอาจารย์/คนทำงาน
- **ปัญหาไฟล์หมดอายุ (เป็นจริง):** LINE เก็บไฟล์/รูป/วิดีโอบนเซิร์ฟเวอร์ "ระยะเวลาจำกัดที่ไม่เปิดเผย" หลังจากนั้นเปิด/ดาวน์โหลดไม่ได้ (ตัวเลข "14 วัน" เป็นข่าวลือ ไม่ใช่ทางการ — **ห้ามอ้างเป็นข้อเท็จจริง**)
- **LINE Keep ถูกยกเลิก 28 ส.ค. 2024** → เกิดช่องว่างเรื่องที่เก็บไฟล์ถาวร (หมายเหตุ: "Keep Memo" ยังอยู่ แต่ไฟล์ในนั้นก็หมดอายุ → ช่องว่างจริงคือ "ที่เก็บถาวร+ค้นหาได้")
- **ปัญหาอื่น:** แชตล้น, หาข้อมูลเก่ายาก, ไม่มีระบบสรุป, ต้องตอบซ้ำ ๆ เอง
- **มีงานวิจัยรองรับ:** การใช้ LINE ทำงานส่งผลลบต่อ work engagement ของอาจารย์ไทย
- **ช่องว่างตลาด:** บอท LINE ในไทยเป็น B2B ตอบลูกค้าหมด (ZWIZ.AI, Botnoi ฯลฯ) — **ไม่มี "ผู้ช่วยส่วนบุคคล"**
- ⚠️ **ความเสี่ยง:** LINE เองกำลังออก agentic AI assistant ในไทยต้นปี 2026 → ต้องชูจุดต่าง (ส่วนตัว/privacy/file vault/ภาษาไทย)

---

## 3. วัตถุประสงค์ (Objectives)

1. พัฒนาผู้ช่วย AI บน LINE ที่จดจำบริบทการสนทนาข้ามเซสชันได้
2. พัฒนา **File Vault** ดาวน์โหลด+จัดเก็บไฟล์ก่อนหมดอายุ พร้อมค้นหา
3. พัฒนา **ระบบความจำระยะยาวคล้ายมนุษย์** รองรับภาษาไทย
4. เปิดความสามารถผ่าน **MCP** ให้ AI ภายนอกเรียกใช้
5. **ประเมินผลเชิงวิทยาศาสตร์** (benchmark + metrics + ablation)

---

## 4. ฟีเจอร์ (เรียงตามความสำคัญ)

| ฟีเจอร์ | ระดับ | หมายเหตุ |
|---|---|---|
| 📁 **File Vault** (กันไฟล์หมดอายุ) | ⭐ MVP / Killer | ฟีเจอร์เด่น แก้ pain จริง — ทำก่อน |
| 📝 **สรุปแชต/ประชุม + ดึง to-do** | ⭐ MVP | rolling summary |
| 🧠 **ความจำถาวร (จำบริบทข้ามเซสชัน)** | ⭐ MVP → ลึกในเฟส 2-3 | แก่นวิชาการ |
| 🇹🇭 **รองรับภาษาไทย** | ⭐ สำคัญ | จุดแปลกใหม่ (low-resource) |
| ⏳ **Memory Decay (ลืมแบบมนุษย์)** | 🟡 เฟส 3 | จุดแปลกใหม่เชิงทฤษฎี |
| 🔌 **MCP Server** | 🟡 เฟส 3 | จุดว้าว + resume signal |
| 🔍 **Research Agent (ค้นเว็บ/YouTube → สรุป → รายงาน)** | 🔵 ของแถม | ทำเฉพาะถ้ามีเวลา (มีข้อจำกัด ดูข้อ 8) |

---

## 5. สถาปัตยกรรม (Architecture)

```
        👤 ผู้ใช้ (อาจารย์/คนทำงาน) คุยผ่าน LINE
                    │  webhook (HTTPS)
                    ▼
        ┌───────────────────────────────┐
        │  LINE Bot (Frontend)          │  FastAPI + line-bot-sdk
        │  - รับ event / ตอบกลับ          │
        │  - ดาวน์โหลดไฟล์ (get-content)  │
        └───────────────────────────────┘
                    │ เรียกใช้
                    ▼
        ┌───────────────────────────────┐
        │  🧠 CORE LIBRARY (สมอง)        │  ← สร้างเอง = ส่วนที่ได้คะแนน
        │  - Fact Extraction             │
        │  - Memory Decay (Ebbinghaus)   │
        │  - Hybrid Retrieval (BM25+vec) │
        │  - Summarization               │
        └───────────────────────────────┘
             │            │             │
       Vector DB     Object Storage   เปิดผ่าน
       (ความจำ)      (File Vault)     MCP Server
             │            │             │
        pgvector/     Cloudflare R2   🔌 ให้ Claude/
        Oracle 23ai                    ChatGPT/Cursor ใช้
```

**หลักการ:** ทั้ง LINE bot และ MCP server เรียกใช้ **Core Library เดียวกัน** — ห้ามเขียนโค้ดซ้ำ

---

## 6. Tech Stack (ฟรี/ต้นทุนต่ำทั้งหมด)

| ส่วน | เครื่องมือ | หมายเหตุ |
|---|---|---|
| ภาษา/Backend | **Python + FastAPI** | async เหมาะกับ I/O + LLM |
| LINE | `line-bot-sdk-python` (v3) | official SDK |
| LLM (ภาษาไทย) | **Gemini 2.5 Flash** (free tier) + **Typhoon** (ไทยเฉพาะ) fallback | ไม่ต้องบัตรเครดิต |
| Embeddings (ไทย) | **BGE-M3** (รันฟรี) | รองรับไทย |
| Vector DB + ฐานข้อมูล | **Supabase (Postgres + pgvector)** หรือ **Oracle DB 23ai** (มี vector search ในตัว ฟรี) | เก็บข้อมูล+vector ที่เดียว |
| Object Storage (File Vault) | **Cloudflare R2** (ฟรี 10GB, egress ฟรี) | เก็บไฟล์ถาวร |
| MCP | **FastMCP** (อยู่ใน MCP Python SDK) | `@mcp.tool()` |
| Hosting | **Google Cloud Run** หรือ **Koyeb** | ดูกับดักข้อ 8 |
| ทดสอบ MCP | **MCP Inspector** (`npx @modelcontextprotocol/inspector`) | เดโม่ได้โดยไม่ต้องมี Claude Desktop |
| Local LLM (ทางเลือก) | **Ollama + OpenThaiGPT** | ฟรี privacy เต็ม (ต้อง RAM 8GB+) |

---

## 7. การตัดสินใจเชิงเทคนิค & เหตุผล

- **ทำไม Memory Engine สร้างเอง ไม่ใช้สำเร็จรูป:** เป็นส่วนที่ได้คะแนน/ความลึกวิชาการ (ถ้า fork framework มาทั้งก้อน = คะแนนน้อย). อาจใช้ **Mem0** เป็น component ช่วยได้ แต่ logic หลักสร้างเอง
- **ทำไมมี MCP:** เปลี่ยนโปรเจกต์จาก "บอทธรรมดา" เป็น "ระบบที่ AI ใดก็ใช้ได้" + เป็นมาตรฐานอุตสาหกรรม 2026 (Anthropic/OpenAI/Google/Microsoft รองรับ, อยู่ใต้ Linux Foundation)
- **MCP server ≠ แอปแชต:** MCP เป็น backend ไม่มี UI/ผู้ใช้เอง ต้องมี host (Claude/Cursor) มาเรียก → จึงต้องมี LINE เป็น frontend แยก
- **ทำไม LINE:** คนไทยใช้เยอะสุด มี user จริง (แม้ API จุกจิก) — Telegram จุกจิกน้อยกว่าแต่คนไทยไม่ค่อยใช้
- **Hermes Agent:** ใช้เป็น "ต้นแบบ/แรงบันดาลใจ" หรือ "พนักงาน (worker service)" สำหรับงาน research ได้ แต่ **ไม่รองรับ LINE** และไม่ควรเอามาเป็น core (ของจริง: github.com/nousresearch/hermes-agent — ระวังเว็บปลอม)

---

## 8. ⚠️ ข้อจำกัด & กับดักสำคัญ (ตรวจสอบแล้ว — อ่านก่อนเขียนโค้ด!)

### LINE Messaging API
- **Reply token หมดอายุ ~60 วินาที + ใช้ครั้งเดียว** → LLM ต้องตอบเร็ว / โชว์ loading animation / ถ้าช้าต้องใช้ push (เปลืองโควต้า)
- **Reply messages ฟรีไม่จำกัด** แต่ **Push/broadcast จำกัด ~200-500/เดือน** (ขึ้นกับ region — ต้องเช็กหน้า pricing ไทยจริง) → ออกแบบให้เป็น "ตอบกลับ" เป็นหลัก, ถ้าทำ research digest ให้ส่งวันละ 1-2 ครั้ง
- **บอทอ่านข้อความได้เฉพาะแชต/กลุ่มที่บอทเป็นสมาชิก** — อ่านแชตอื่นที่บอทไม่ได้อยู่ไม่ได้ (กำแพง privacy)
- ในกลุ่มที่บอทอยู่ → ได้รับ **ทุกข้อความ** (ไม่ต้อง @) แต่ต้องตั้งค่า: เปิด "Allow bot to join group chats" + อยู่ใน Bot mode + เปิด webhook
- ต้องมี **HTTPS endpoint ที่มี CA cert** (self-signed ไม่ได้)

### File Vault — ขอบเขตที่ต้องสื่อสารตามจริง
- ดาวน์โหลดไฟล์ผ่าน `GET https://api-data.line.me/v2/bot/message/{messageId}/content` **ทันที**ที่ไฟล์เข้ามา (เพราะหมดอายุไว ไม่รับประกันเวลา)
- ⚠️ **เก็บได้เฉพาะไฟล์ที่ส่งหาบอท / ในกลุ่มที่บอทอยู่** — **ไม่ใช่ backup ทั้ง LINE** (อ่านแชตเก่า/ส่วนตัวของ user ไม่ได้)
- ใช้ได้เมื่อ `contentProvider.type == "line"` เท่านั้น (ถ้า "external" ต้องใช้ originalContentUrl)
- ไฟล์อาจถูกบีบอัด (ไม่ใช่ byte-perfect เสมอ)
- ไฟล์วิดีโอ/เสียงใหญ่อาจคืน HTTP 202 (ต้องเช็ก status ก่อนโหลด)
- **มี LINE Developers Thailand tutorial ทางการสอนทำเรื่องนี้** (ค้น "linedevth media cloud storage")

### Hosting ฟรี 24/7 (กับดักใหญ่)
- **Render free** = หลับหลังไม่มีคน 15 นาที → cold start 30-60 วิ (ชนกับ reply token 60 วิ!)
- **แนะนำ:** Google Cloud Run (scale-to-zero, cold start สั้น) หรือ **Koyeb** — เหมาะกับ webhook
- Railway/Fly.io **ไม่ฟรีแล้ว** สำหรับ 24/7 (ข้อมูล 2026)

### LLM / Search free tier
- Gemini free tier มีจำกัด (เช็ก rate limit ปัจจุบันใน AI Studio) + **ข้อมูลฟรีอาจถูกใช้ train** → ระวังข้อมูลส่วนตัว, ใช้ Vertex/paid หรือ Ollama local ถ้าต้อง opt-out
- **Web Search API ฟรียากในปี 2026:** Brave เลิก free tier, Google CSE ปิดรับใหม่, Bing API ตาย → เหลือ **Tavily** (ฟรี ~1,000/เดือน) หรือ self-host **SearXNG**
- **YouTube transcript:** ฟรีแต่ YouTube บล็อก IP ของ cloud → รันบน server ฟรีจะล่ม (ต้องรันจากเครื่องบ้าน หรือจ่าย proxy) + ขัด ToS

### กฎหมาย
- **PDPA:** เก็บข้อความ/ไฟล์ = ข้อมูลส่วนบุคคล → ต้องมี consent + privacy notice + ลบข้อมูลได้ (บังคับใช้จริงจังปี 2025-2026) — **จุดนี้เขียนในรายงานจะได้คะแนนความรอบคอบ**

---

## 9. ระเบียบวิธี: Memory Engine (แก่นวิชาการ)

ระบบความจำ 3 ชั้น:
1. **Short-term:** เก็บข้อความล่าสุด N ข้อความ (verbatim) ใส่ใน prompt ทุกครั้ง
2. **Summarization:** เมื่อยาวเกิน → สรุปแบบ rolling/running summary (เก็บใจความ ประหยัด token)
3. **Long-term (RAG):** ฝัง embedding → เก็บใน vector DB (key ด้วย userId) → ค้น top-k มาใส่ prompt

เทคนิคเด่น (จุดแปลกใหม่):
- **Fact Extraction:** สกัด "ข้อเท็จจริงถาวร" จากบทสนทนา (ADD/UPDATE/DELETE) แทนการเก็บข้อความดิบ
- **Memory Decay:** ความจำเก่า/ไม่ถูกใช้ จางลงตามเวลา (อ้างอิง **Ebbinghaus Forgetting Curve** / exponential time-decay) — ของที่ถูกเรียกบ่อย/สำคัญคงอยู่
- **Hybrid Retrieval:** ผสม BM25 (keyword) + vector (semantic) ให้ค้นแม่นขึ้น
- **ภาษาไทย:** ใช้ embeddings ที่รองรับไทย (BGE-M3) + จัดการตัดคำ (ไทยไม่มีเว้นวรรค = ปัญหายาก = จุดวิจัย)

---

## 10. การวัดผล (Evaluation) — ห้ามตัด!

นี่คือสิ่งที่เปลี่ยน "โปรแกรม" เป็น "งานวิจัย":
- **Benchmark:** สร้างชุดทดสอบภาษาไทยเอง หรืออ้างแนว **LoCoMo / LongMemEval** (conversational memory benchmark)
- **Metrics:** recall@k, precision@k, MRR, nDCG (การค้นคืน) + ความแม่นการตอบ (F1 / LLM-judge) + latency (p50/p95) + tokens/query
- **Ablation study:** เปรียบเทียบ มี/ไม่มี memory decay, BM25-only vs vector-only vs hybrid, มี/ไม่มี fact extraction
- → มีตาราง/กราฟในรายงาน

---

## 11. แผน 4 เดือน (Timeline)

| เดือน | ช่วง | งาน | 🎯 Milestone |
|---|---|---|---|
| **1** | มิ.ย.–ก.ค. | Proposal + Setup + **File Vault** | ส่งไฟล์เข้าบอท → เก็บขึ้น cloud → ดึงกลับได้ + อาจารย์อนุมัติ |
| **2** | ก.ค.–ส.ค. | **Memory Engine + สรุปแชต (ไทย)** | จำบริบทข้ามเซสชัน + สรุปไทยได้ |
| **3** | ส.ค.–ก.ย. | **Memory Decay + Hybrid Retrieval + MCP** | decay ทำงาน + MCP ใช้ใน Claude ได้ |
| **4** | ก.ย.–ต.ค. | **Evaluation + รายงาน + เดโม่** | ผลการวัด (ตาราง/กราฟ) + รายงานจบ + สไลด์ |

รายละเอียดเดือน 1:
- สัปดาห์ 1-2: proposal + ตั้งค่า (LINE channel, webhook, repo, DB, hosting) + echo bot
- สัปดาห์ 3-4: File Vault (รับไฟล์ → get-content → R2 → ค้นกลับ)

---

## 12. MVP Scope & ลำดับการตัด (ถ้าเวลาไม่พอ)

**MVP (ต้องมี):** File Vault + สรุปแชต + ความจำพื้นฐาน + Evaluation
**ตัดตามลำดับนี้ถ้าช้า:**
1. ตัด Research Agent (Hermes/ค้นเว็บ) ก่อน
2. ตัด MCP server
3. ตัด Memory Decay
4. **ห้ามตัด:** File Vault, ความจำพื้นฐาน, สรุป, **Evaluation**

> กฎรอดตาย: ทำ MVP ให้ใช้ได้จริงก่อน + กันเวลาเดือนสุดท้ายไว้เขียนรายงาน

---

## 13. แหล่งอ้างอิง & เครื่องมือ

- LINE Developers: https://developers.line.biz/en/docs/messaging-api/
- LINE get-content (archiving): `api-data.line.me/v2/bot/message/{messageId}/content`
- MCP: https://modelcontextprotocol.io/ , FastMCP (ใน MCP Python SDK)
- MCP Inspector: `npx @modelcontextprotocol/inspector`
- Memory references: Mem0 (mem0.ai), LoCoMo / LongMemEval benchmarks
- Thai LLM: Gemini (ai.google.dev), Typhoon (opentyphoon.ai), OpenThaiGPT (Ollama)
- Embeddings: BGE-M3 (BAAI/bge-m3)
- Storage: Cloudflare R2, Supabase, Oracle DB 23ai (AI Vector Search)
- Hermes Agent (อ้างอิงเท่านั้น): github.com/nousresearch/hermes-agent

---

## 14. 📌 หมายเหตุสำหรับ AI/ผู้ช่วยที่จะมาช่วยสร้างต่อ

- โปรเจกต์นี้ **ยังไม่เริ่มเขียนโค้ด** — อยู่ขั้นออกแบบ/วางแผน
- **เริ่มที่ MVP เดือน 1:** echo bot บน LINE → File Vault ก่อน (เห็นผลเร็ว สร้างกำลังใจ)
- โครงโค้ดแนะนำ: แยก `core/` (memory engine, ไม่ผูกกับ LINE) ออกจาก `line_bot/` (frontend) และ `mcp_server/` — ทั้งสาม import `core/` ตัวเดียวกัน
- **อย่าลืมข้อจำกัดในข้อ 8** โดยเฉพาะ reply token 60 วิ, file vault เก็บเฉพาะไฟล์ที่ส่งหาบอท, hosting cold start
- เป้าหมาย: ฟรีทั้งหมด (free tier), รองรับภาษาไทย, มี evaluation เชิงวิทยาศาสตร์
- เอกสาร proposal (มีดีไซน์) อยู่ใน Canva แล้ว — เอกสารนี้คือ "แผนทางเทคนิค" สำหรับลงมือสร้าง
