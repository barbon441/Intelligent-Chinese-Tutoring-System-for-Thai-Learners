1chJ��ܟ�E��qUM㡆��b4D}[�ใช้งานกับ Ollama Local และ Gemini API

เอกสารนี้สรุปขั้นตอนการติดตั้ง สร้างโปรเจกต์ และตั้งค่า CrewAI ให้ใช้งานได้ทั้งแบบ **Ollama Local LLM** และ **Google Gemini API** บน Windows PowerShell

> ตัวอย่างหลักในเอกสารนี้ใช้ชื่อโปรเจกต์ `career_plan_agents`

---

## 1. ภาพรวมการทำงานของ CrewAI

CrewAI คือ framework สำหรับสร้างระบบ AI Agents หลายตัวให้ทำงานร่วมกัน โดยทั่วไปจะประกอบด้วยส่วนสำคัญดังนี้

| ส่วนประกอบ | หน้าที่ |
|---|---|
| Agent | ตัวแทนผู้เชี่ยวชาญ เช่น Career Analyst, Gap Analyst |
| Task | งานที่มอบหมายให้ Agent ทำ |
| Crew | กลุ่มของ Agent และ Task ที่ทำงานร่วมกัน |
| LLM | โมเดลภาษา เช่น Ollama, Gemini, OpenAI |
| Tools | เครื่องมือเสริม เช่น อ่านไฟล์, เรียก API, คำนวณ |
| Knowledge | ข้อมูลความรู้เพิ่มเติมให้ Agent ใช้อ้างอิง |

ตัวอย่าง workflow ของ `career_plan_agents`

```text
Learner Profile
      ↓
Career Profile Analyst
      ↓
Qualification Gap Analyst
      ↓
Development Plan Designer
      ↓
Self Assessment Coach
      ↓
Final Career Development Report
```

---

## 2. เตรียมเครื่องมือพื้นฐาน

### 2.1 ตรวจ Python

CrewAI ต้องใช้ Python เวอร์ชัน `>=3.10` และ `<3.14`

```powershell
python --version
```

ถ้ายังไม่มี Python ให้ติดตั้งจาก:

```text
https://www.python.org/downloads/
```

---

### 2.2 ติดตั้ง uv บน Windows

เปิด PowerShell แล้วรัน:

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

จากนั้นปิด PowerShell แล้วเปิดใหม่ แล้วตรวจสอบ:

```powershell
uv --version
```

ถ้าคำสั่ง `uv` ยังไม่ทำงาน ให้รัน:

```powershell
uv tool update-shell
```

แล้วปิด PowerShell เปิดใหม่อีกครั้ง

---

### 2.3 ติดตั้ง CrewAI CLI

```powershell
uv tool install crewai
```

ตรวจสอบ:

```powershell
crewai --version
uv tool list
```

อัปเดต CrewAI CLI:

```powershell
uv tool install crewai --upgrade
```

---

## 3. สร้างโปรเจกต์ CrewAI

CrewAI ปัจจุบันมี 2 แนวทางที่พบบ่อย

| แนวทาง | โครงสร้าง | เหมาะกับ |
|---|---|---|
| JSON-first | `crew.jsonc`, `agents/`, `tools/`, `skills/` | ผู้เริ่มต้น สร้างผ่าน interactive CLI |
| Classic / YAML | `src/project/crew.py`, `config/agents.yaml`, `config/tasks.yaml` | ผู้ที่ต้องการควบคุม LLM, base_url, code ได้ละเอียด |

---

## 4. สร้างโปรเจกต์แบบ JSON-first

```powershell
cd D:\crewai
crewai create crew career_plan_agents
```

ระหว่างสร้าง ระบบจะถาม Agent, Tools, Planning, Delegation และ Memory

### Agent 1

```text
Role > Career Profile Analyst
Goal > Analyze the learner profile, target career, current skills, interests, and experience to identify career development needs.
Backstory > You are an expert career advisor who helps students and professionals understand their strengths, weaknesses, and career readiness.
```

### Agent 2

```text
Role > Qualification Gap Analyst
Goal > Compare the learner's current competencies with the required qualifications of the target career and identify skill gaps.
Backstory > You are an expert in competency-based assessment and career readiness analysis.
```

### Agent 3

```text
Role > Development Plan Designer
Goal > Create a practical individual career development plan based on skill gaps, priorities, learning resources, and timeline.
Backstory > You are a learning and development specialist who designs personalized development plans.
```

### Agent 4

```text
Role > Self Assessment Coach
Goal > Help the learner reflect on current performance and suggest improvement actions.
Backstory > You are a supportive assessment coach who helps learners evaluate themselves using evidence, examples, and performance levels.
```

### คำตอบแนะนำระหว่างสร้าง

```text
Tools: No tools
Enable step-by-step planning? y
Allow delegation to other agents? N
Enable crew memory? N
```

เหตุผล:

- ยังไม่ต้องเปิด Tools จนกว่าจะมี custom function หรือ API
- เปิด Planning เพราะงาน Career Plan มีหลายขั้นตอน
- ปิด Delegation ก่อนเพื่อให้ควบคุมลำดับงานง่าย
- ปิด Memory ก่อนเพื่อลดปัญหา embedding/vector database

---

## 5. สร้างโปรเจกต์แบบ Classic / YAML

ถ้าต้องการใช้ `crew.py` แนะนำสร้างด้วย `--classic`

```powershell
cd D:\crewai
crewai create crew career_plan_agents_classic --classic
```

โครงสร้างที่คาดหวัง:

```text
career_plan_agents_classic/
├── .env
├── pyproject.toml
├── README.md
├── knowledge/
└── src/
    └── career_plan_agents_classic/
        ├── __init__.py
        ├── main.py
        ├── crew.py
        ├── tools/
        └── config/
            ├── agents.yaml
            └── tasks.yaml
```

ถ้าเกิด Hatch build error ว่าไม่พบ package ให้ดูหัวข้อ Troubleshooting ด้านล่าง

---

## 6. ติดตั้ง dependency ของโปรเจกต์

เข้าโฟลเดอร์โปรเจกต์:

```powershell
cd D:\crewai\career_plan_agents
```

ติดตั้ง dependency:

```powershell
crewai install
```

หรือ:

```powershell
uv sync
```

เพิ่ม package ใหม่:

```powershell
uv add package-name
```

---

# Part A: ใช้ CrewAI กับ Ollama Local

## 7. ติดตั้งและตรวจสอบ Ollama

ติดตั้ง Ollama จาก:

```text
https://ollama.com/
```

ตรวจสอบ model ที่มี:

```powershell
ollama list
```

ตัวอย่าง model ที่เหมาะกับงานเริ่มต้น:

```text
llama3:latest
qwen3:14b
scb10x/llama3.2-typhoon2-t1-3b-research-preview:latest
```

แนะนำเริ่มจาก:

```text
llama3:latest
```

เพราะขนาดไม่ใหญ่เกินไปและรันง่ายกว่า model 14B

---

## 8. ทดสอบ Ollama Local

```powershell
ollama run llama3:latest
```

ถ้าเข้า prompt ได้ ให้พิมพ์:

```text
/bye
```

ตรวจว่า Ollama local server เปิดอยู่:

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
```

ถ้าเห็นรายการ models แปลว่า Ollama local พร้อมใช้งาน

---

## 9. ติดตั้ง LiteLLM สำหรับ Ollama

Ollama ใน CrewAI ใช้ผ่าน LiteLLM ดังนั้นให้เพิ่ม dependency:

```powershell
uv add "crewai[litellm]"
```

ถ้าเห็น warning แบบนี้:

```text
warning: Failed to hardlink files; falling back to full copy.
```

ไม่ใช่ error บน Windows รันต่อได้ตามปกติ

---

## 10. ตั้งค่า .env สำหรับ Ollama

เปิดไฟล์ `.env`

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

> ถ้าเคยใช้ model ที่ลงท้าย `:cloud` เช่น `minimax-m2.7:cloud` ให้ลบออก เพราะจะไปเรียก Ollama Cloud และอาจเจอ error 403 subscription

---

## 11. ใช้ Ollama ใน crew.py แบบชัวร์ที่สุด

ถ้าใช้ Classic project ให้เปิด:

```powershell
notepad src\career_plan_agents\crew.py
```

ตัวอย่าง `crew.py` ที่เลือก LLM จาก `.env` และบังคับ Ollama ให้ใช้ local endpoint:

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
    """Career Plan Agents crew."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def career_profile_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config["career_profile_analyst"],
            llm=llm,
            verbose=True,
        )

    @agent
    def qualification_gap_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config["qualification_gap_analyst"],
            llm=llm,
            verbose=True,
        )

    @agent
    def development_plan_designer(self) -> Agent:
        return Agent(
            config=self.agents_config["development_plan_designer"],
            llm=llm,
            verbose=True,
        )

    @agent
    def self_assessment_coach(self) -> Agent:
        return Agent(
            config=self.agents_config["self_assessment_coach"],
            llm=llm,
            verbose=True,
        )

    @task
    def analyze_profile_task(self) -> Task:
        return Task(
            config=self.tasks_config["analyze_profile_task"],
        )

    @task
    def analyze_gap_task(self) -> Task:
        return Task(
            config=self.tasks_config["analyze_gap_task"],
        )

    @task
    def create_development_plan_task(self) -> Task:
        return Task(
            config=self.tasks_config["create_development_plan_task"],
        )

    @task
    def write_final_report_task(self) -> Task:
        return Task(
            config=self.tasks_config["write_final_report_task"],
            output_file="output/career_plan_report.md",
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

# Part B: ใช้ CrewAI กับ Google Gemini API

## 12. สร้าง Gemini API Key

เข้า:

```text
https://aistudio.google.com/
```

ขั้นตอน:

1. Sign in ด้วยบัญชี Google
2. เปิด Dashboard
3. ไปที่ API Keys
4. กด Create API key
5. เลือกหรือสร้าง Google Cloud project
6. Copy API key เก็บไว้

ข้อควรระวัง:

- ห้าม commit API key ขึ้น GitHub
- เก็บ API key ใน `.env`
- ใส่ `.env` ใน `.gitignore`
- ถ้าใช้ key ใน production ควรตั้ง restriction ใน Google Cloud Console หรือ AI Studio

---

## 13. ติดตั้ง dependency สำหรับ Gemini

```powershell
uv add "crewai[google-genai]"
```

---

## 14. ตั้งค่า .env สำหรับ Gemini

เปิดไฟล์:

```powershell
notepad .env
```

ตั้งค่าแบบใดแบบหนึ่ง

### แบบใช้ GOOGLE_API_KEY

```env
GOOGLE_API_KEY=your_gemini_api_key_here
MODEL=gemini/gemini-2.0-flash
```

### แบบใช้ GEMINI_API_KEY

```env
GEMINI_API_KEY=your_gemini_api_key_here
MODEL=gemini/gemini-2.0-flash
```

โมเดลที่แนะนำ:

```env
MODEL=gemini/gemini-2.0-flash
```

หรือ:

```env
MODEL=gemini/gemini-2.5-flash
```

---

## 15. ใช้ Gemini ใน crew.py

ถ้าใช้ `crew.py` ตัวอย่างในหัวข้อ Ollama แล้ว ไม่ต้องแก้ code เพิ่ม เพียงเปลี่ยน `.env` เป็น:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
MODEL=gemini/gemini-2.0-flash
```

เพราะฟังก์ชัน `build_llm()` จะใช้ `base_url` เฉพาะกรณี `MODEL` ขึ้นต้นด้วย `ollama/` เท่านั้น

---

# Part C: ตัวอย่าง Career Plan Agents แบบ Classic

## 16. agents.yaml

สร้างหรือแก้ไฟล์:

```powershell
notepad src\career_plan_agents\config\agents.yaml
```

ใส่:

```yaml
career_profile_analyst:
  role: >
    Career Profile Analyst
  goal: >
    Analyze the learner profile, target career, current skills, interests,
    and experience to identify career development needs.
  backstory: >
    You are an expert career advisor who helps students and professionals
    understand their strengths, weaknesses, and career readiness.

qualification_gap_analyst:
  role: >
    Qualification Gap Analyst
  goal: >
    Compare the learner's current competencies with the required qualifications
    of the target career and identify skill gaps.
  backstory: >
    You are an expert in competency-based assessment and career readiness analysis.

development_plan_designer:
  role: >
    Development Plan Designer
  goal: >
    Create a practical individual career development plan based on skill gaps,
    priorities, learning resources, and timeline.
  backstory: >
    You are a learning and development specialist who designs personalized
    development plans for students and professionals.

self_assessment_coach:
  role: >
    Self Assessment Coach
  goal: >
    Help the learner reflect on current performance and suggest improvement actions.
  backstory: >
    You are a supportive assessment coach who helps learners evaluate themselves
    honestly using evidence, examples, and performance levels.
```

---

## 17. tasks.yaml

สร้างหรือแก้ไฟล์:

```powershell
notepad src\career_plan_agents\config\tasks.yaml
```

ใส่:

```yaml
analyze_profile_task:
  description: >
    Analyze the learner profile: {learner_profile}.
    The target career is {target_career}.
    Identify strengths, weaknesses, and important career readiness issues.
  expected_output: >
    A structured summary of the learner profile, strengths, weaknesses,
    and career readiness issues.
  agent: career_profile_analyst

analyze_gap_task:
  description: >
    Compare the learner's current self-assessment: {self_assessment}
    with the required qualifications: {required_qualifications}.
    Identify competency gaps and priority areas.
  expected_output: >
    A gap analysis table showing required qualifications, current level,
    target level, gap level, and priority.
  agent: qualification_gap_analyst

create_development_plan_task:
  description: >
    Create an individual career development plan for {target_career}
    based on the learner profile, competency gaps, and development priorities.
  expected_output: >
    A practical development plan with development goals, activities,
    learning channels, timeline, evidence, and expected outcomes.
  agent: development_plan_designer

write_final_report_task:
  description: >
    Write a final report summarizing the career analysis, qualification gap analysis,
    self-assessment suggestions, and individual development plan.
  expected_output: >
    A complete report with sections: learner profile, target career,
    required qualifications, gap analysis, development plan, and recommendations.
  agent: self_assessment_coach
```

---

## 18. main.py

สร้างหรือแก้ไฟล์:

```powershell
notepad src\career_plan_agents\main.py
```

ใส่:

```python
from career_plan_agents.crew import CareerPlanAgents


def run():
    inputs = {
        "learner_profile": (
            "A Computer Science student with basic skills in Python, HTML, "
            "JavaScript, and databases. Interested in becoming a Software Developer, "
            "but needs improvement in real-world project experience, teamwork, "
            "Git/GitHub, and system design."
        ),
        "target_career": "Software Developer",
        "self_assessment": (
            "Python 3/5, HTML 3/5, JavaScript 2/5, Database 2/5, "
            "Git/GitHub 1/5, Web Development 2/5, Software Engineering 2/5, "
            "System Design 1/5, Problem Solving 3/5, Teamwork 3/5, Communication 3/5."
        ),
        "required_qualifications": (
            "Programming in Python or JavaScript, database knowledge, Git/GitHub, "
            "web application development, SDLC understanding, problem-solving, "
            "basic system design, teamwork, communication, and real-world project "
            "development skills."
        ),
    }

    result = CareerPlanAgents().crew().kickoff(inputs=inputs)
    print(result)


if __name__ == "__main__":
    run()
```

---

## 19. pyproject.toml

เปิด:

```powershell
notepad pyproject.toml
```

ให้มีส่วนสำคัญนี้:

```toml
[project.scripts]
career_plan_agents = "career_plan_agents.main:run"

[tool.hatch.build.targets.wheel]
packages = ["src/career_plan_agents"]
```

ถ้า project/package เป็นชื่ออื่น ให้แก้ `"src/career_plan_agents"` ให้ตรงกับโฟลเดอร์จริงที่มี `__init__.py`

---

## 20. รันโปรเจกต์

### รันผ่าน crewai

```powershell
crewai install
crewai run
```

### รันผ่าน uv script

```powershell
uv sync
uv run career_plan_agents
```

ถ้า `crewai run` ยังไปใช้ `crew.jsonc` เดิม ให้ใช้:

```powershell
uv run career_plan_agents
```

---

# Part D: ตัวอย่าง input สำหรับทดสอบ

เมื่่อ CrewAI ถามค่า input ให้กรอกแบบนี้

## learner_profile

```text
A Computer Science student with basic skills in Python, HTML, JavaScript, and databases. Interested in becoming a Software Developer, but needs improvement in real-world project experience, teamwork, Git/GitHub, and system design.
```

## required_qualifications

```text
Programming in Python or JavaScript, database knowledge, Git/GitHub, web application development, SDLC understanding, problem-solving, basic system design, teamwork, communication, and real-world project development skills.
```

## self_assessment

```text
Python 3/5, HTML 3/5, JavaScript 2/5, Database 2/5, Git/GitHub 1/5, Web Development 2/5, Software Engineering 2/5, System Design 1/5, Problem Solving 3/5, Teamwork 3/5, Communication 3/5.
```

## target_career

```text
Software Developer
```

---

# Part E: Troubleshooting

## 21. Error 403: this model requires a subscription

ตัวอย่าง error:

```text
Error code: 403 - {'error': 'this model requires a subscription, upgrade for access: https://ollama.com/upgrade'}
```

สาเหตุที่พบบ่อย:

- ใช้ model แบบ Ollama Cloud เช่น `minimax-m2.7:cloud`
- ไม่ได้กำหนด `base_url="http://localhost:11434"`
- JSON-first config ยังมี cloud model ค้างอยู่

ค้นหาในโปรเจกต์:

```powershell
Get-ChildItem -Recurse -File | Select-String -Pattern "minimax|cloud|ollama|MODEL|llm|model|base_url"
```

แก้ให้เป็น local:

```env
MODEL=ollama/llama3
OLLAMA_BASE_URL=http://localhost:11434
```

ถ้าใช้ `crew.py` ให้แน่ใจว่า:

```python
LLM(
    model="ollama/llama3",
    base_url="http://localhost:11434"
)
```

---

## 22. uv warning: Failed to hardlink files

ข้อความ:

```text
warning: Failed to hardlink files; falling back to full copy.
```

ไม่ใช่ error มักเกิดบน Windows หรือ drive คนละ filesystem ถ้าต้องการซ่อน warning ใช้:

```powershell
$env:UV_LINK_MODE="copy"
```

หรือรันแบบครั้งเดียว:

```powershell
uv sync --link-mode=copy
```

---

## 23. Hatch build error: Unable to determine which files to ship

ข้อความ:

```text
ValueError: Unable to determine which files to ship inside the wheel
The most likely cause is that there is no directory that matches the name of your project
```

แก้ใน `pyproject.toml`:

```toml
[tool.hatch.build.targets.wheel]
packages = ["src/career_plan_agents"]
```

ตรวจว่าโฟลเดอร์นี้มีจริง:

```powershell
Get-ChildItem src\career_plan_agents
```

ต้องมีไฟล์:

```text
__init__.py
main.py
crew.py
```

---

## 24. Gemini API key ไม่ทำงาน

ตรวจ `.env`

```env
GOOGLE_API_KEY=your_gemini_api_key_here
MODEL=gemini/gemini-2.0-flash
```

หรือ:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MODEL=gemini/gemini-2.0-flash
```

ติดตั้ง dependency:

```powershell
uv add "crewai[google-genai]"
```

ตรวจว่าไม่มี `MODEL=ollama/...` ค้างอยู่ ถ้าต้องการใช้ Gemini

---

## 25. CrewAI ถาม input ทุกครั้ง

ถ้าใช้ `crewai run` แล้วระบบถาม:

```text
learner_profile >
required_qualifications >
self_assessment >
target_career >
```

เป็นพฤติกรรมปกติ เพราะใน `tasks.yaml` หรือ `crew.jsonc` มี placeholders เช่น:

```text
{learner_profile}
{target_career}
{self_assessment}
{required_qualifications}
```

ถ้าต้องการไม่ต้องกรอกทุกครั้ง ให้กำหนด input ใน `main.py` แล้วรันผ่าน:

```powershell
uv run career_plan_agents
```

---

# Part F: สลับระหว่าง Ollama และ Gemini

## ใช้ Ollama Local

`.env`

```env
MODEL=ollama/llama3
OLLAMA_BASE_URL=http://localhost:11434
```

ติดตั้ง:

```powershell
uv add "crewai[litellm]"
```

ทดสอบ:

```powershell
ollama run llama3:latest
uv run career_plan_agents
```

---

## ใช้ Gemini API

`.env`

```env
GOOGLE_API_KEY=your_gemini_api_key_here
MODEL=gemini/gemini-2.0-flash
```

ติดตั้ง:

```powershell
uv add "crewai[google-genai]"
```

ทดสอบ:

```powershell
uv run career_plan_agents
```

---

# Part G: แนะนำ workflow สำหรับการสอน

ลำดับการสอนที่แนะนำ

```text
1. อธิบาย Agent / Task / Crew / LLM
2. ติดตั้ง uv และ CrewAI
3. สร้างโปรเจกต์ JSON-first ผ่าน CLI
4. รันตัวอย่างด้วย Gemini
5. เปลี่ยนมาใช้ Ollama local
6. อธิบาย error 403 และการกำหนด base_url
7. สร้าง classic project พร้อม crew.py
8. เพิ่ม agents.yaml และ tasks.yaml
9. สร้าง Career Plan report
10. ต่อ REST API หรือ Quasar frontend ภายหลัง
```

---

## References

- CrewAI Installation: https://docs.crewai.com/en/installation
- CrewAI LLMs: https://docs.crewai.com/en/concepts/llms
- LiteLLM Ollama Provider: https://docs.litellm.ai/docs/providers/ollama
- Gemini API Keys: https://ai.google.dev/gemini-api/docs/api-key
- Google AI Studio: https://aistudio.google.com/
- Ollama: https://ollama.com/
