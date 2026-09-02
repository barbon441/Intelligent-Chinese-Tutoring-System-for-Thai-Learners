# สร้างผัง ER ทุกแบบจาก er-drawio.sql (แหล่งจริงเดียว) — รันซ้ำเมื่อ schema เปลี่ยน
#   ① ER-星航.drawio            (เปิดใน draw.io / ใส่เล่ม)
#   ② ผัง mermaid ใน DATABASE-ER.md §2 (เห็นบน GitHub/Obsidian)
#   ③ ER-ฉบับย่อ-星航.drawio    (`--slim`) — หัวตาราง + คีย์เท่านั้น ตามที่อาจารย์สั่งนัดรอบ 5 (24 ส.ค.)
#      ตัดคอลัมน์ที่ไม่ใช่ PK/FK/UK ออก → กล่องเตี้ยลงมาก เส้นไม่ก่ายกัน ใช้อธิบาย/ใส่โปสเตอร์ได้
#      ไม่ได้แยกไฟล์ SQL ต่างหาก เพราะจะกลายเป็นแหล่งจริงแหล่งที่สองแล้วขัดกันเองในที่สุด
# เหตุผล: ปัญหาที่กัดทีมมาตลอดคือ "ผังกับ DDL ไม่ตรงกัน" (20 ส.ค. ไล่ตรวจเจอไม่ตรง 6 จุด)
#         ถ้าผังทุกอันสร้างจาก DDL เสมอ ปัญหานี้หมดไปโดยโครงสร้าง ไม่ต้องอาศัยความขยันไล่ตรวจ
# วิธีใช้:  python scripts/gen_er_diagrams.py
import io, re, html, sys

SLIM = "--slim" in sys.argv          # โหมดฉบับย่อ: เหลือแต่หัวตาราง + คีย์

SQL = "docs/08_สเปค-พัฒนา/er-drawio.sql"
OUT = ("docs/08_สเปค-พัฒนา/ER-ฉบับย่อ-星航.drawio" if SLIM
       else "docs/08_สเปค-พัฒนา/ER-星航.drawio")
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
    if SLIM:                                   # เหลือแต่คีย์ — ที่เหลือไปดูในฉบับเต็ม
        cols = [c for c in cols if c[2].strip()]
    tables.append((name, cols))

# ---------- ③ โหมดฉบับย่อ: ผังหลายหน้า วางแบบลดเส้นตัดกัน ----------
# ปัญหาที่แก้: ผังหน้าเดียว 23 ตาราง 35 เส้น ยังไงเส้นก็ตัดกันและพาดทับตัวหนังสือ
# ทางแก้ 2 ชั้น
#   ① ซอยเป็น 7 หน้า (แท็บล่างใน draw.io) — ภาพรวม 1 หน้า + เดินตามผู้ใช้ 6 ก้าว หน้าละ 3-7 กล่อง
#   ② หน้าไหนก็ตาม จัดคอลัมน์ตามลำดับการอ้างอิง (ตารางแม่อยู่ซ้าย ลูกอยู่ขวา) แล้วเรียงแถวด้วย
#      barycenter sweep เพื่อลดจำนวนเส้นตัดกัน + เดินเส้นในช่องว่างระหว่างคอลัมน์ ไม่พาดทับกล่อง
if SLIM:
    by_name = dict(tables)

    JOURNEY = [
        ("① สมัครใช้งาน", ["users"]),
        ("② แบบทดสอบก่อนเรียน", ["users", "exam_forms", "items", "form_items", "sessions"]),
        ("③ ตอบทีละข้อ", ["users", "sessions", "items", "words", "sentences", "skills", "attempts"]),
        ("④ รู้ว่าอ่อนตรงไหน", ["attempts", "bkt_training_runs", "skills", "thai_l1_catalog",
                                  "mastery_snapshots", "recommendations", "users", "sessions"]),
        ("⑤ เรียนคำ + นัดทวน", ["categories", "words", "sentences", "sentence_words",
                                   "review_states", "users", "skills"]),
        ("⑥ บทปูพื้นฐานเสียง", ["foundation_stages", "foundation_lessons", "foundation_progress",
                                  "minimal_pairs", "users", "skills", "words"]),
    ]

    SW, CHAN, ROW_GAP, HDR2, ROW_H, TOP2, LEFT = 250, 190, 55, 28, 22, 92, 40

    def layers_of(names, links):
        """จัดคอลัมน์ตามความลึกของการอ้างอิง — ตารางที่ไม่ชี้ใครเลยอยู่ซ้ายสุด"""
        parents = {n: set() for n in names}
        for c, p, _ in links:
            if c in parents and p in names and c != p:
                parents[c].add(p)
        depth, busy = {}, set()

        def d(n):
            if n in depth:
                return depth[n]
            if n in busy or not parents[n]:      # กันวงวน
                return 0
            busy.add(n)
            v = max((d(p) + 1 for p in parents[n]), default=0)
            busy.discard(n)
            depth[n] = v
            return v

        for n in names:
            d(n)
        cols = {}
        for n in names:
            cols.setdefault(depth.get(n, 0), []).append(n)
        return [sorted(cols[k]) for k in sorted(cols)]

    def crossings(cols, pos, links):
        """นับเส้นตัดกันแบบชั้นต่อชั้น — ใช้เทียบก่อน/หลังจัดเรียง"""
        idx = {n: (ci, ri) for ci, c in enumerate(cols) for ri, n in enumerate(c)}
        pairs = [(idx[p], idx[c]) for c, p, _ in links if c in idx and p in idx]
        n = 0
        for i in range(len(pairs)):
            for j in range(i + 1, len(pairs)):
                (a1, b1), (a2, b2) = pairs[i], pairs[j]
                if a1[0] == a2[0] and b1[0] == b2[0] and a1[0] != b1[0]:
                    if (a1[1] - a2[1]) * (b1[1] - b2[1]) < 0:
                        n += 1
        return n

    def order_rows(cols, links):
        """barycenter sweep — เลื่อนกล่องขึ้นลงให้เส้นตัดกันน้อยที่สุด"""
        nb = {}
        for c, p, _ in links:
            nb.setdefault(c, set()).add(p)
            nb.setdefault(p, set()).add(c)
        for _ in range(6):
            for ci in list(range(1, len(cols))) + list(range(len(cols) - 2, -1, -1)):
                rank = {n: i for cc in cols for i, n in enumerate(cc)}
                cols[ci].sort(key=lambda n: (
                    sum(rank[m] for m in nb.get(n, ()) if m in rank) / max(1, len(
                        [m for m in nb.get(n, ()) if m in rank])), n))
        return cols

    def render_page(title, names, pid):
        names = [n for n in names if n in by_name]
        links = [(c, p, col) for c, p, col in fks if c in names and p in names and c != p]
        cols = layers_of(names, links)
        before = crossings(cols, None, links)
        cols = order_rows(cols, links)
        after = crossings(cols, None, links)

        geo, cells_, max_y = {}, [], 0
        for ci, col in enumerate(cols):
            x = LEFT + ci * (SW + CHAN)
            y = TOP2
            for name in col:
                cs = by_name[name]
                h = HDR2 + ROW_H * len(cs)
                geo[name] = (x, y, h)
                style = ("swimlane;fontStyle=1;align=center;childLayout=stackLayout;horizontal=1;"
                         "startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;"
                         "collapsible=0;rounded=1;arcSize=4;" + (GREEN if name in LIVE else BLUE))
                cells_.append(
                    f'<mxCell id="{pid}_{name}" value="{name}" style="{style}" vertex="1" parent="1">'
                    f'<mxGeometry x="{x}" y="{y}" width="{SW}" height="{h}" as="geometry"/></mxCell>')
                for ri, (col_, typ, tag, _n) in enumerate(cs):
                    label = html.escape(f"{col_} : {typ}{tag}")
                    cells_.append(
                        f'<mxCell id="{pid}_{name}_r{ri}" value="{label}" style="text;strokeColor=none;'
                        f'fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;spacingRight=4;'
                        f'overflow=hidden;whiteSpace=wrap;html=1;fontSize=11;'
                        f'{"fontStyle=1;" if tag else ""}" vertex="1" parent="{pid}_{name}">'
                        f'<mxGeometry y="{HDR2 + ROW_H*ri}" width="{SW}" height="{ROW_H}" as="geometry"/></mxCell>')
                y += h + ROW_GAP
                max_y = max(max_y, y)

        edges_, seen = [], set()
        for i, (child, parent, _c) in enumerate(links):
            if (child, parent) in seen:
                continue
            seen.add((child, parent))
            px, py, ph = geo[parent]
            cx, cy, ch = geo[child]
            if px < cx:                                   # ซ้าย → ขวา (ปกติ)
                ex, en, wx = 1, 0, (px + SW + cx) / 2
            elif px > cx:                                 # ขวา → ซ้าย
                ex, en, wx = 0, 1, (cx + SW + px) / 2
            else:                                         # คอลัมน์เดียวกัน — อ้อมทางซ้าย
                ex, en, wx = 0, 0, px - CHAN / 2
            style = ("edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;jumpStyle=arc;jumpSize=9;"
                     f"exitX={ex};exitY=0.5;exitDx=0;exitDy=0;entryX={en};entryY=0.5;entryDx=0;entryDy=0;"
                     "startArrow=ERone;startFill=0;endArrow=ERmany;endFill=0;strokeColor=#93a3b5;")
            edges_.append(
                f'<mxCell id="{pid}_e{i}" style="{style}" edge="1" parent="1" '
                f'source="{pid}_{parent}" target="{pid}_{child}">'
                f'<mxGeometry relative="1" as="geometry"><Array as="points">'
                f'<mxPoint x="{int(wx)}" y="{int(py + ph/2)}"/></Array></mxGeometry></mxCell>')

        head = (f'<mxCell id="{pid}_ttl" value="&lt;b&gt;{html.escape(title)}&lt;/b&gt;&amp;nbsp; '
                f'&lt;span style=&quot;color:#777&quot;&gt;{len(names)} ตาราง · {len(edges_)} เส้น · '
                f'เส้นตัดกัน {after}&lt;/span&gt;" '
                'style="text;html=1;align=left;fontSize=15;fontColor=#333333;" vertex="1" parent="1">'
                f'<mxGeometry x="{LEFT}" y="24" width="1200" height="30" as="geometry"/></mxCell>')

        w = LEFT + len(cols) * (SW + CHAN) + 40
        body = ('      <root>\n        <mxCell id="0"/>\n        <mxCell id="1" parent="0"/>\n        '
                + head + "\n        " + "\n        ".join(cells_)
                + ("\n        " + "\n        ".join(edges_) if edges_ else "") + "\n      </root>\n")
        page = (f'  <diagram name="{html.escape(title)}" id="{pid}">\n'
                f'    <mxGraphModel dx="1018" dy="686" grid="1" gridSize="10" guides="1" tooltips="1" '
                f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{w}" '
                f'pageHeight="{int(max_y)+40}" math="0" shadow="0">\n' + body
                + "    </mxGraphModel>\n  </diagram>\n")
        return page, before, after, len(names), len(edges_)

    pages, report = [], []
    p, b, a, nt, ne = render_page("ภาพรวมทั้งระบบ", [n for n, _ in tables], "ov")
    pages.append(p); report.append(("ภาพรวมทั้งระบบ", nt, ne, b, a))
    for si, (t, names) in enumerate(JOURNEY):
        p, b, a, nt, ne = render_page(t, names, f"s{si}")
        pages.append(p); report.append((t, nt, ne, b, a))

    io.open(OUT, "w", encoding="utf-8").write(
        '<mxfile host="app.diagrams.net">\n' + "".join(pages) + "</mxfile>\n")

    print(f"✅ เขียน {OUT}")
    print(f"   {len(pages)} หน้า (แท็บล่างใน draw.io)")
    print(f"   {'หน้า':<24}{'ตาราง':>6}{'เส้น':>6}{'ตัดกันก่อนจัด':>15}{'หลังจัด':>10}")
    for t, nt, ne, b, a in report:
        print(f"   {t:<24}{nt:>6}{ne:>6}{b:>15}{a:>10}")
    sys.exit(0)

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
