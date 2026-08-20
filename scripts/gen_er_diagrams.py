# สร้างผัง ER ทั้ง 2 แบบจาก er-drawio.sql (แหล่งจริงเดียว) — รันซ้ำเมื่อ schema เปลี่ยน
#   ① ER-星航.drawio            (เปิดใน draw.io / ใส่เล่ม)
#   ② ผัง mermaid ใน DATABASE-ER.md §2 (เห็นบน GitHub/Obsidian)
# เหตุผล: ปัญหาที่กัดทีมมาตลอดคือ "ผังกับ DDL ไม่ตรงกัน" (20 ส.ค. ไล่ตรวจเจอไม่ตรง 6 จุด)
#         ถ้าผังทุกอันสร้างจาก DDL เสมอ ปัญหานี้หมดไปโดยโครงสร้าง ไม่ต้องอาศัยความขยันไล่ตรวจ
# วิธีใช้:  python scripts/gen_er_diagrams.py
import io, re, html, sys

SQL = "docs/08_สเปค-พัฒนา/er-drawio.sql"
OUT = "docs/08_สเปค-พัฒนา/ER-星航.drawio"
MD  = "docs/08_สเปค-พัฒนา/DATABASE-ER.md"

LIVE = {"words", "roadmap_state"}          # ชั้น 1 = เขียว · ที่เหลือ = พิมพ์เขียว น้ำเงิน
GREEN = "fillColor=#d5e8d4;strokeColor=#82b366;"
BLUE  = "fillColor=#dae8fc;strokeColor=#6c8ebf;"

# ---------- อ่าน SQL ----------
raw = io.open(SQL, encoding="utf-8").read()

tables = []   # (name, [(col, type, tag, note)])
fks = []      # (child, parent, label)
for name, body in re.findall(r"CREATE TABLE (\w+)\s*\((.*?)\n\);", raw, re.S):
    nocom_body = "\n".join(re.sub(r"--.*$", "", l) for l in body.split("\n"))
    pk_multi = set()
    m = re.search(r"PRIMARY KEY \(([^)]*)\)", nocom_body)
    if m:
        pk_multi = {c.strip() for c in m.group(1).split(",")}
    cols = []
    for ln in body.split("\n"):
        note = ""
        if "--" in ln:                       # คอมเมนต์ท้ายบรรทัด → ใช้เป็นคำอธิบายคอลัมน์ในผัง mermaid
            ln, note = ln.split("--", 1)
            note = note.strip()
        ln = ln.strip().rstrip(",")
        if not ln or ln.upper().startswith(("PRIMARY KEY (", "CHECK", "CONSTRAINT", "UNIQUE (")):
            continue
        mm = re.match(r"(\w+)\s+([\w]+(?:\[\])?)", ln)   # ชนิด = โทเคนแรกเท่านั้น
        if not mm:                                        # (ไม่งั้นจะกิน "PRIMARY"/"NOT" ติดมาด้วย)
            continue
        col, typ = mm.group(1), mm.group(2)
        tag = ""
        if "PRIMARY KEY" in ln or col in pk_multi:
            tag = " PK"
        ref = re.search(r"REFERENCES (\w+)\(", ln)
        if ref:
            tag += " FK"
            fks.append((name, ref.group(1), col))
        if re.search(r"\bUNIQUE\b", ln) and " PK" not in tag:
            tag += " UK"
        cols.append((col, typ, tag, note))
    tables.append((name, cols))

# ---------- จัดวางเป็นโซน ----------
COLUMNS = [
    ("โซน 1 · เนื้อหา (คำ/หมวด)",       ["categories", "words", "sentence_words"]),
    ("โซน 2 · เนื้อหา (ประโยค/โมดูล 0)", ["sentences", "foundation_stages", "foundation_lessons",
                                          "minimal_pairs"]),
    ("โซน 3 · ทักษะ + โมเดล",            ["skills", "bkt_training_runs", "thai_l1_catalog"]),
    ("โซน 4 · คลังข้อสอบ",               ["exam_forms", "form_items", "items", "item_skills"]),
    ("โซน 5 · ผู้เรียน + การตอบ",        ["users", "sessions", "attempts"]),
    ("โซน 6 · ผลและระบบ",                ["review_states", "mastery_snapshots", "foundation_progress",
                                          "recommendations", "approval_transfers", "roadmap_state"]),
]
placed = {t for _, ts in COLUMNS for t in ts}
missing = {n for n, _ in tables} - placed
if missing:
    print("⚠️ ตารางที่ยังไม่ได้จัดโซน:", missing); sys.exit(1)

W, GAP_X, GAP_Y, TOP, HDR = 270, 320, 45, 110, 28
by_name = dict(tables)

cells, edges = [], []
max_y = 0
for ci, (zone, names) in enumerate(COLUMNS):
    x = 40 + ci * GAP_X
    cells.append(
        f'<mxCell id="z{ci}" value="{html.escape(zone)}" style="text;html=1;align=center;fontSize=13;'
        f'fontStyle=1;fontColor=#555555;" vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="60" width="{W}" height="30" as="geometry"/></mxCell>'
    )
    y = TOP
    for name in names:
        cols = by_name[name]
        h = HDR + 22 * len(cols)
        style = "swimlane;fontStyle=1;align=center;childLayout=stackLayout;horizontal=1;startSize=28;" \
                "horizontalStack=0;resizeParent=1;resizeParentMax=0;collapsible=0;rounded=1;arcSize=4;" \
                + (GREEN if name in LIVE else BLUE)
        cells.append(
            f'<mxCell id="t_{name}" value="{name}" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{W}" height="{h}" as="geometry"/></mxCell>'
        )
        for ri, (col, typ, tag, _note) in enumerate(cols):
            label = html.escape(f"{col} : {typ}{tag}")
            bold = "fontStyle=1;" if tag else ""
            cells.append(
                f'<mxCell id="t_{name}_r{ri}" value="{label}" style="text;strokeColor=none;fillColor=none;'
                f'align=left;verticalAlign=middle;spacingLeft=6;spacingRight=4;overflow=hidden;'
                f'portConstraint=eastwest;whiteSpace=wrap;html=1;fontSize=11;{bold}" vertex="1" parent="t_{name}">'
                f'<mxGeometry y="{HDR + 22*ri}" width="{W}" height="22" as="geometry"/></mxCell>'
            )
        y += h + GAP_Y
        max_y = max(max_y, y)

seen = set()
for i, (child, parent, _c) in enumerate(fks):
    if (child, parent) in seen:      # FK ซ้ำคู่เดิม (เช่น approval_transfers → users 2 เส้น) วาดเส้นเดียว
        continue
    seen.add((child, parent))
    edges.append(
        f'<mxCell id="e{i}" style="edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;'
        f'startArrow=ERone;startFill=0;endArrow=ERmany;endFill=0;strokeColor=#666666;" '
        f'edge="1" parent="1" source="t_{parent}" target="t_{child}"><mxGeometry relative="1" as="geometry"/></mxCell>'
    )

legend = (
    '<mxCell id="legend" value="&lt;b&gt;ER — 星航&lt;/b&gt;&amp;nbsp; '
    '&lt;span style=&quot;color:#82b366&quot;&gt;■&lt;/span&gt; เขียว = มีจริงใน Supabase วันนี้ &amp;nbsp; '
    '&lt;span style=&quot;color:#6c8ebf&quot;&gt;■&lt;/span&gt; น้ำเงิน = พิมพ์เขียว (m7-1 เป็นต้นไป) &amp;nbsp;·&amp;nbsp; '
    'สร้างอัตโนมัติจาก er-drawio.sql — แก้ schema ที่ไฟล์ SQL แล้ว generate ใหม่" '
    'style="text;html=1;align=left;fontSize=14;fontColor=#333333;" vertex="1" parent="1">'
    '<mxGeometry x="40" y="16" width="1700" height="30" as="geometry"/></mxCell>'
)

xml = (
    '<mxfile host="app.diagrams.net">\n'
    '  <diagram name="ER-星航" id="er-xinghang">\n'
    f'    <mxGraphModel dx="1018" dy="686" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" '
    f'arrows="1" fold="1" page="1" pageScale="1" pageWidth="{40 + len(COLUMNS)*GAP_X + 60}" '
    f'pageHeight="{int(max_y) + 60}" math="0" shadow="0">\n'
    '      <root>\n        <mxCell id="0"/>\n        <mxCell id="1" parent="0"/>\n        '
    + legend + "\n        "
    + "\n        ".join(cells) + "\n        "
    + "\n        ".join(edges)
    + "\n      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n"
)

io.open(OUT, "w", encoding="utf-8").write(xml)
print(f"✅ เขียน {OUT}")
print(f"   ตาราง {len(tables)} · เส้นความสัมพันธ์ {len(edges)} · แถวคอลัมน์ {sum(len(c) for _,c in tables)}")
print(f"   หน้ากระดาษ {40 + len(COLUMNS)*GAP_X + 60} x {int(max_y)+60}")

# ---------- ② ผัง mermaid ใน DATABASE-ER.md §2 ----------
LAYER1 = {"words", "roadmap_state"}      # ผังชั้น 1 เขียนมือไว้แล้ว — สคริปต์นี้แตะเฉพาะผังชั้น 2

def mm_type(t):
    return t.replace("[]", "_arr").replace(" ", "_")

def mm_note(n, limit=64):
    n = re.sub(r'["\n]', "", n).strip()
    n = re.sub(r"\s+", " ", n)
    if len(n) <= limit:
        return n
    cut = n[:limit]
    sp = cut.rfind(" ")                    # ตัดที่ช่องว่าง ไม่ตัดกลางคำ
    return (cut[:sp] if sp > limit * 0.6 else cut).rstrip(" ·-—") + "…"

lines = ["erDiagram"]
pair_seen = set()
for child, parent, colname in fks:
    if (parent, child) in pair_seen:
        continue
    pair_seen.add((parent, child))
    lines.append(f"    {parent.upper()} ||--o{{ {child.upper()} : {colname}")
for name, cols in tables:
    if name in LAYER1 and name != "words":   # words ต้องมีกล่องในผังชั้น 2 ด้วย (มีเส้นชี้เข้า)
        continue
    lines.append(f"    {name.upper()} {{")
    for col, typ, tag, note in cols:
        tag = tag.strip()
        note = mm_note(note)
        parts = [mm_type(typ), col] + ([tag] if tag else []) + ([f'"{note}"'] if note else [])
        lines.append("        " + " ".join(parts))
    lines.append("    }")
mermaid = "```mermaid\n" + "\n".join(lines) + "\n```"

md = io.open(MD, encoding="utf-8").read()
blocks = list(re.finditer(r"```mermaid.*?```", md, re.S))
if len(blocks) < 2:
    print("⚠️ ไม่พบผัง mermaid ชั้น 2 ใน DATABASE-ER.md — ข้ามการอัปเดต"); sys.exit(1)
b = blocks[1]
io.open(MD, "w", encoding="utf-8").write(md[:b.start()] + mermaid + md[b.end():])
print(f"✅ อัปเดตผัง mermaid ใน {MD}")
print(f"   กล่อง {len(lines and [l for l in lines if l.endswith(' {')])} · เส้น {len(pair_seen)}")
