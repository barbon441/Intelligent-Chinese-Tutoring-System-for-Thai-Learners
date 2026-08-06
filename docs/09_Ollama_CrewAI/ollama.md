# Ollama Installation Guide

เอกสารนี้สอนการติดตั้งและใช้งาน **Ollama** แบบ step by step โดยเน้น Windows PowerShell และการเตรียมใช้งานร่วมกับ CrewAI

---

## 1. Ollama คืออะไร

Ollama เป็นโปรแกรมสำหรับดาวน์โหลด จัดการ และรัน Large Language Models หรือ LLMs บนเครื่องของเราเอง เช่น `llama3`, `qwen`, `gemma`, `deepseek` และ model อื่น ๆ

จุดเด่นของ Ollama:

- รัน LLM บนเครื่อง local ได้
- ใช้งานผ่าน command line ได้
- มี local REST API ที่ `http://localhost:11434`
- ใช้ร่วมกับ CrewAI, LangChain, LiteLLM และโปรแกรมอื่นได้
- ลดการพึ่งพา cloud model ในบางกรณี

---

## 2. ความต้องการเบื้องต้น

แนะนำสำหรับ Windows:

| รายการ | คำแนะนำ |
|---|---|
| OS | Windows 10 หรือ Windows 11 |
| RAM | อย่างน้อย 8 GB, แนะนำ 16 GB ขึ้นไป |
| Disk | อย่างน้อย 10 GB สำหรับเริ่มต้น |
| GPU | ไม่จำเป็น แต่ถ้ามี NVIDIA GPU จะรันเร็วขึ้น |
| Internet | ใช้ตอนติดตั้งและดาวน์โหลด model |

หมายเหตุ: model ขนาดใหญ่ เช่น 14B หรือมากกว่า จะใช้ RAM/VRAM สูงกว่า model ขนาดเล็ก

---

## 3. ติดตั้ง Ollama บน Windows

### วิธีที่ 1: ติดตั้งผ่าน PowerShell

เปิด **Windows PowerShell** แล้วรัน:

```powershell
irm https://ollama.com/install.ps1 | iex
```

หลังติดตั้งเสร็จ ให้ปิด PowerShell แล้วเปิดใหม่

---

### วิธีที่ 2: ดาวน์โหลดจากเว็บไซต์

เข้าเว็บไซต์:

```text
https://ollama.com/download
```

จากนั้นเลือก **Download for Windows** แล้วติดตั้งตามขั้นตอนของโปรแกรม

---

## 4. ตรวจสอบว่าติดตั้งสำเร็จ

เปิด PowerShell แล้วรัน:

```powershell
ollama --version
```

ถ้าติดตั้งสำเร็จ จะเห็น version ของ Ollama

ตรวจสอบรายการ model ที่มีในเครื่อง:

```powershell
ollama list
```

ถ้ายังไม่เคยดาวน์โหลด model รายการอาจว่างได้ ไม่ถือว่าเป็น error

---

## 5. ดาวน์โหลดและรัน model แรก

แนะนำเริ่มจาก `llama3`

```powershell
ollama pull llama3:latest
```

หรือดาวน์โหลดและเริ่ม chat ทันที:

```powershell
ollama run llama3:latest
```

เมื่อเข้า prompt แล้วจะเห็น:

```text
>>>
```

ลองพิมพ์คำถาม:

```text
Explain what a software developer does.
```

ออกจาก prompt:

```text
/bye
```

---

## 6. ตรวจสอบ Ollama Local API

Ollama จะเปิด local API ที่ port `11434`

ทดสอบด้วย PowerShell:

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
```

ถ้าสำเร็จจะเห็นรายการ models เช่น:

```text
llama3:latest
qwen3:14b
bge-m3:latest
```

---

## 7. คำสั่ง Ollama ที่ควรรู้

### ดูรายการ model ในเครื่อง

```powershell
ollama list
```

### ดาวน์โหลด model

```powershell
ollama pull llama3:latest
```

### รัน model

```powershell
ollama run llama3:latest
```

### ดูรายละเอียด model

```powershell
ollama show llama3:latest
```

### ลบ model

```powershell
ollama rm llama3:latest
```

### ออกจาก chat prompt

```text
/bye
```

---

## 8. Model ที่แนะนำสำหรับเริ่มต้น

### ใช้งานทั่วไป

```powershell
ollama pull llama3:latest
```

### เครื่อง RAM มากขึ้น หรือต้องการ reasoning ดีขึ้น

```powershell
ollama pull qwen3:14b
```

### งานภาษาไทย ทดลองใช้ Typhoon

```powershell
ollama run scb10x/llama3.2-typhoon2-t1-3b-research-preview:latest
```

หมายเหตุ: ชื่อ model ต้องตรงกับที่ปรากฏจากคำสั่ง `ollama list`

---

## 9. ใช้ Ollama ร่วมกับ CrewAI

เข้าโฟลเดอร์โปรเจกต์ CrewAI เช่น:

```powershell
cd D:\crewai\career_plan_agents
```

ติดตั้ง LiteLLM สำหรับให้ CrewAI เรียก Ollama ได้:

```powershell
uv add "crewai[litellm]"
```

แก้ไฟล์ `.env`

```powershell
notepad .env
```

ใส่:

```env
MODEL=ollama/llama3
OLLAMA_BASE_URL=http://localhost:11434
```

หรือถ้าต้องการระบุ tag:

```env
MODEL=ollama/llama3:latest
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 10. ข้อควรระวังเรื่อง Ollama Cloud

อย่าใช้ model ที่ลงท้ายด้วย `:cloud` ถ้าต้องการรัน local เช่น:

```env
MODEL=ollama/minimax-m2.7:cloud
```

เพราะจะไปเรียก Ollama Cloud และอาจเจอ error:

```text
403 this model requires a subscription
```

ให้เปลี่ยนเป็น local model เช่น:

```env
MODEL=ollama/llama3
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 11. ตัวอย่าง crew.py สำหรับ CrewAI + Ollama Local

ถ้าใช้ CrewAI แบบ classic project สามารถกำหนด LLM แบบบังคับใช้ local ได้ดังนี้

```python
import os

from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task


MODEL = os.getenv("MODEL", "ollama/llama3")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


def build_llm() -> LLM:
    if MODEL.startswith("ollama/"):
        return LLM(
            model=MODEL,
            base_url=OLLAMA_BASE_URL,
            temperature=0.3,
        )

    return LLM(
        model=MODEL,
        temperature=0.3,
    )


llm = build_llm()


@CrewBase
class CareerPlanAgents:
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def career_profile_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config["career_profile_analyst"],
            llm=llm,
            verbose=True,
        )

    @task
    def analyze_profile_task(self) -> Task:
        return Task(
            config=self.tasks_config["analyze_profile_task"],
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
```

---

## 12. ทดสอบ CrewAI กับ Ollama

ตรวจสอบว่า Ollama ทำงานก่อน:

```powershell
ollama run llama3:latest
```

ออกด้วย:

```text
/bye
```

จากนั้นรัน CrewAI:

```powershell
crewai run
```

หรือถ้ามี script ใน `pyproject.toml`:

```powershell
uv run career_plan_agents
```

---

## 13. ติดตั้ง Ollama บน Linux/macOS

บน Linux/macOS ใช้คำสั่ง:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

ตรวจสอบ:

```bash
ollama --version
ollama run llama3
```

---

## 14. Troubleshooting

### ปัญหา: `ollama` ไม่รู้จักคำสั่ง

แนวทางแก้:

1. ปิด PowerShell แล้วเปิดใหม่
2. ตรวจว่า Ollama ติดตั้งแล้ว
3. ลองติดตั้งใหม่จาก `https://ollama.com/download`

---

### ปัญหา: Port 11434 ใช้ไม่ได้

ทดสอบ:

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
```

ถ้าไม่ได้ ให้ลองเปิด Ollama app หรือรัน:

```powershell
ollama serve
```

ถ้า port ถูกใช้งานโดยโปรแกรมอื่น ให้ปิดโปรแกรมนั้นก่อน

---

### ปัญหา: CrewAI ขึ้น 403 subscription

ค้นหา model ที่เป็น cloud:

```powershell
Get-ChildItem -Recurse -File | Select-String -Pattern "cloud|minimax|ollama|MODEL|llm|base_url"
```

เปลี่ยนจาก:

```env
MODEL=ollama/minimax-m2.7:cloud
```

เป็น:

```env
MODEL=ollama/llama3
OLLAMA_BASE_URL=http://localhost:11434
```

---

### ปัญหา: model ช้า

แนวทางแก้:

- ใช้ model เล็กลง
- ปิดโปรแกรมอื่นที่ใช้ RAM/VRAM
- ใช้ GPU ถ้ามี
- เริ่มจาก `llama3:latest` ก่อน
- หลีกเลี่ยง model ขนาด 14B ถ้า RAM ไม่พอ

---

### ปัญหา: ดาวน์โหลด model ช้า

แนวทางแก้:

- ตรวจ internet
- ลองดาวน์โหลด model ขนาดเล็กก่อน
- ตรวจพื้นที่ว่างใน drive
- ใช้ `ollama pull <model>` เพื่อดาวน์โหลดล่วงหน้า

---

## 15. Checklist หลังติดตั้ง

รันตรวจทีละคำสั่ง:

```powershell
ollama --version
ollama list
ollama run llama3:latest
Invoke-RestMethod http://localhost:11434/api/tags
```

ถ้าทั้งหมดผ่าน แปลว่า Ollama พร้อมใช้งานกับ CrewAI แล้ว

---

## 16. References

- Ollama Official Download: https://ollama.com/download
- Ollama GitHub: https://github.com/ollama/ollama
- Ollama Library: https://ollama.com/library
- Ollama API Documentation: https://github.com/ollama/ollama/blob/main/docs/api.md
- CrewAI LLM Documentation: https://docs.crewai.com/concepts/llms
