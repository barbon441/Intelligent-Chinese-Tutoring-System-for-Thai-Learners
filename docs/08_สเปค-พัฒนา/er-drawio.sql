-- ต้นทางจริงของ schema — แก้ที่ไฟล์นี้เสมอ แล้วรัน `python scripts/gen_er_diagrams.py` เพื่อสร้างผังใหม่
--   เพิ่ม `--slim` = สร้างผังฉบับย่อ (หัวตาราง + คีย์) ลง ER-ฉบับย่อ-星航.drawio
-- ที่มา: docs/08_สเปค-พัฒนา/DATABASE-ER.md (ขั้น 1-3) · อินพุตขั้น 0: ความต้องการข้อมูล-User-Journey.md
--
-- ⚠️ ลำดับ CREATE เรียงตาม dependency ของ FK แล้ว (ตารางแม่มาก่อนตารางลูก) — รันใน Postgres ได้ตรง ๆ
-- ⚠️ ไฟล์นี้ยังไม่ใช่ migration — ตอนเขียน migration ต้องเติม identity/default/index/RLS
--    และ CHECK constraint ที่จดไว้เป็นคอมเมนต์ (draw.io parser อ่าน CHECK/ALTER ไม่ออก จะทำให้กล่องเพี้ยน)
--
-- 📖 อ่านสัญลักษณ์ในคอมเมนต์:
--    [cache]   = ค่าที่คำนวณซ้ำจากตารางอื่นได้ แต่จงใจเก็บไว้เพื่อความเร็ว — ต้องมีคนอัปเดต ห้ามปล่อยให้ drift
--    [แผน …]   = ยังไม่มีจริงใน Supabase วันนี้
--    STATUS5   = ชุดคำสถานะกลางของทั้งระบบ: draft | pending | approved | rejected | suspended
--                (เดิม 5 ตารางใช้คำว่า status เหมือนกันแต่ค่าไม่ตรงกันสักคู่ — รวมคำให้ตรงกัน 21 ส.ค.)

-- ===== ชั้นที่ 1: ใช้จริงวันนี้ (dump จาก Supabase จริง — data/seeds/001–004) =====
--
-- 📌 ความซื่อตรงสองชั้น: ทุกคอลัมน์ในบล็อกนี้ "มีอยู่จริงใน DB วันนี้" ยกเว้นที่ติดป้าย (แผน …)

CREATE TABLE words (
  id bigint PRIMARY KEY,
  hanzi text NOT NULL UNIQUE,
  traditional text,
  pinyin text NOT NULL,
  pos text[],
  meaning_en jsonb,
  meaning_th text,
  th_reviewed boolean NOT NULL,    -- มีจริงวันนี้ · เก็บไว้เพื่อ backward-compat
  review_status text,              -- (แผน m7-2) STATUS5 — boolean แทน "รอตรวจ" ของโฟลว์ 4.1 ไม่ได้
  reviewed_by uuid,                -- (แผน m7-2) CG-01 บังคับว่าคำแปลต้องผ่านหฤทัย — ต้องรู้ว่าใครตรวจ
  reviewed_at timestamptz,         -- (แผน m7-2)
  hsk_level integer NOT NULL,
  category smallint,               -- วันนี้เป็นเลขลอย ๆ · จะกลายเป็น FK → categories(id) ตอน m7-2
  audio_path text,
  image_path text,                 -- (แผน C5)
  etymology_image_path text,       -- (แผน m1-7)
  etymology_story_th text,         -- (แผน m1-7)
  wordlist_version text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz           -- (แผน m7-2) หน้า Admin ต้องเรียงคิวรอตรวจตามเวลาแก้ล่าสุด
);

CREATE TABLE roadmap_state (
  item_id text PRIMARY KEY,
  done boolean NOT NULL,
  updated_by uuid,                 -- (แผน m7-1) RO-04 จะจำกัดสิทธิ์เขียนเฉพาะแอดมิน — ต้องรู้ว่าใครติ๊ก
  updated_at timestamptz NOT NULL
);

-- ===== ชั้นที่ 2: พิมพ์เขียวเมื่อมีล็อกอิน (m7-1+) =====

-- 5 หมวดเรียน — วันนี้ hardcode ใน apps/web/src/data/categories.ts (แก้ชื่อ/ลำดับทีต้อง deploy)
-- migration ที่สร้างตารางนี้ต้องเติม:
--   ALTER TABLE words ADD CONSTRAINT words_category_fk FOREIGN KEY (category) REFERENCES categories(id);
CREATE TABLE categories (
  id smallint PRIMARY KEY,         -- 1-5
  name_th text NOT NULL,
  summary_th text,
  difficulty_order smallint NOT NULL,  -- ลำดับแนะนำ ง่าย→ยาก (PA-09)
  word_count smallint,             -- [cache] นับจาก words ได้ · เก็บไว้เพราะหน้าเลือกหมวดเรียกทุกครั้ง
  created_at timestamptz NOT NULL,
  updated_at timestamptz
);

-- role            = บังคับ RO-02/RO-03 เชิงข้อมูล (ปุ่มอนุมัติกดได้เฉพาะหฤทัย)
-- consent_version = ต้องรู้ว่าใครยอมรับข้อความ consent "ฉบับไหน" ถ้าแก้ข้อความทีหลัง (ข้อกำหนด PDPA)
-- cohort/trial_started_at = แยกผู้เข้าร่วมทดลอง ~10 คน (ME-02) ออกจากบัญชีทีมตอนวิเคราะห์
-- anonymized_at   = ทางลงของ ON-05: ล้าง PII ในแถวนี้ แต่คง id ไว้ → attempts ยัง append-only ครบ FK ไม่พัง
--   ⚠️ อีเมลอยู่ใน auth.users ของ Supabase (คนละตาราง) — ขั้นตอนลบต้องล้างทั้งสองที่
CREATE TABLE users (
  id uuid PRIMARY KEY,
  display_name text,
  role text NOT NULL,              -- learner | admin | approver  (RO-02/RO-03)
  pdpa_consent_at timestamptz,
  consent_version text,            -- ฉบับของข้อความ consent ที่ยอมรับ (ON-05)
  target_level integer,
  exam_date date,
  audio_rate real,
  pinyin_hidden boolean,           -- ค่าตั้งซ่อนพินอิน (m1-6 "จำค่าไว้")
  cohort text,                     -- 'trial' | 'team' | null — ME-02
  trial_started_at timestamptz,
  anonymized_at timestamptz,       -- ถอนความยินยอมแล้ว (ON-05)
  created_at timestamptz NOT NULL,
  updated_at timestamptz
);

-- การเทรน pyBKT แต่ละรอบ — ที่มาของตัวเลขทุกตัวในบทที่ 4
-- เทรนหลายรอบระหว่างการทดลอง (ข้อมูลเพิ่มขึ้นเรื่อย ๆ) ถ้าเก็บแค่ค่าล่าสุดใน skills
-- จะอ้างไม่ได้ว่า "AUC 0.78 ในเล่ม" มาจากรอบไหน ข้อมูลถึงวันไหน กี่คน กี่ attempt
-- variant รองรับ ablation ตรง ๆ: เทรน 2 รอบด้วย Q-matrix มี/ไม่มี Thai-L1 KC แล้วเทียบ auc (ME-03)
-- split_seed  = ต้องมี ไม่งั้นรันซ้ำแล้วได้ AUC ไม่เท่าเดิม → เล่มเคลม "ทำซ้ำได้" ไม่ได้
CREATE TABLE bkt_training_runs (
  id bigint PRIMARY KEY,
  run_at timestamptz NOT NULL,
  data_until timestamptz NOT NULL, -- ใช้ attempts ถึงวันไหน
  n_attempts integer NOT NULL,
  n_users integer NOT NULL,
  kc_count smallint NOT NULL,
  variant text NOT NULL,           -- full | no_thai_l1 (ablation) | slam_benchmark
  split_seed integer NOT NULL,     -- seed ของ train/test split — reproducibility
  auc real,                        -- roc_auc_score บน test split
  auc_by_skill jsonb,
  params jsonb,                    -- สแนปช็อตพารามิเตอร์ทุกทักษะของรอบนี้ (ตัวจริงของค่า BKT)
  notes text
);

-- bkt_* ในตารางนี้ = [cache] ของ "ชุดที่ใช้งานอยู่ตอนนี้" · ตัวจริงอยู่ใน bkt_training_runs.params
-- เก็บซ้ำเพราะ runtime ต้องอ่านเร็วต่อการตอบทุกครั้ง — bkt_run_id บอกว่ามาจากรอบไหน กัน drift เงียบ
CREATE TABLE skills (
  id bigint PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name_th text NOT NULL,
  type text NOT NULL,              -- vocab | grammar | tone | consonant | thai_l1
  hsk_level integer NOT NULL,
  bkt_prior real,                  -- [cache]
  bkt_learn real,                  -- [cache]
  bkt_slip real,                   -- [cache]
  bkt_guess real,                  -- [cache]
  bkt_run_id bigint REFERENCES bkt_training_runs(id),
  created_at timestamptz NOT NULL
);

-- 4 ด่านของบทปูพื้นฐานเสียง — ยกจาก enum ข้อความมาเป็นตาราง (21 ส.ค.)
-- เหตุผล: เดิม stage เป็น text อยู่ 2 ตาราง (foundation_lessons / foundation_progress) ที่ต้องตรงกันเป๊ะ
--         แต่ไม่มีอะไรบังคับ → พิมพ์ผิดแล้วเงียบ · และเกณฑ์ PA-01 (80%) / PA-08 (3 รอบ)
--         เคยเป็นเลขฝังในโค้ด ตอนนี้กลายเป็นข้อมูลที่ปรับได้โดยไม่ต้อง deploy
CREATE TABLE foundation_stages (
  code text PRIMARY KEY,           -- intro | pinyin | tones | ear_game | reference
  name_th text NOT NULL,
  position smallint NOT NULL,
  pass_threshold real,             -- PA-01: ด่าน ear_game ผ่านที่ ~0.80 · ด่านอ่านอย่างเดียว = null
  soft_gate_after_tries smallint   -- PA-08: ไม่ผ่านครบกี่รอบถึงเปิด "ประตูนุ่ม" (ข้อเสนอ 3)
);

-- ชุดข้อสอบ (MK-02 มี 2 ชุด · PL-07 pre=post ใช้ชุดเดียวกัน · โฟลว์ §7-3 ล็อกชุด post)
-- published_at + version = กฎแช่แข็ง (เพิ่ม 21 ส.ค.)
--   locked_until กันคน "เห็น" ล่วงหน้าได้ แต่ไม่กันการ "แก้ข้อ" หลังมีคนทำ pre-test ไปแล้ว
--   ถ้าแก้ได้ → post ไม่ใช่เครื่องมือวัดตัวเดียวกับ pre → gain score ทั้งเล่มเสีย
--   กติกา: published_at IS NOT NULL = ห้ามแก้ form_items ของชุดนี้เด็ดขาด ต้องออก version ใหม่แทน
CREATE TABLE exam_forms (
  id bigint PRIMARY KEY,
  code text NOT NULL UNIQUE,       -- 'HSK1-MOCK-A' | 'HSK1-MOCK-B' | 'PRETEST-A' ...
  version smallint NOT NULL,
  name_th text NOT NULL,
  kind text NOT NULL,              -- pretest | placement | micro_check | mock
  hsk_level integer NOT NULL,
  item_count integer,              -- [cache] นับจาก form_items ได้
  time_limit_s integer,
  locked_until date,               -- ชุด post ห้ามเสิร์ฟจนถึงวันวัดผล
  published_at timestamptz,        -- แช่แข็งแล้ว ห้ามแก้เนื้อในอีก
  research_use_only boolean,       -- true = ใช้ได้แค่ pre กับ post เท่านั้น (มติ pre=post ชุดเดียว)
                                   -- บังคับ 2 อย่าง: ห้ามเสิร์ฟชุดนี้ในโหมดฝึก
                                   -- และข้อใน form_items ของชุดนี้ห้ามถูกสุ่มเข้าควิซท้ายหมวด
                                   -- ไม่มีข้อนี้ = ผู้เรียนเจอข้อเดิมซ้ำตลอด 10 วันจากการฝึกปกติ
                                   -- → คะแนน post เฟ้อเพราะจำข้อ ไม่ใช่เพราะเก่งขึ้น (practice effect)
  status text NOT NULL,            -- STATUS5
  created_at timestamptz NOT NULL,
  updated_at timestamptz
);

-- category   = ต้องมี ไม่งั้น QZ-01 "สุ่ม 10 ข้อจาก item bank ของหมวดนั้น" ทำไม่ได้
--              และโฟลว์ 4.2 "เตือนเมื่อข้อในหมวดเหลือต่ำกว่าขั้นต่ำ" ก็ทำไม่ได้
--              (ไล่ผ่าน item_skills → skills ไม่ได้ เพราะ skills คือทักษะ ไม่ใช่หมวดเนื้อหา)
--              null = ข้อที่ไม่ผูกหมวด เช่น ข้อพื้นฐานเสียงของโมดูล 0
-- created_by = โฟลว์ 4.2 "ตีกลับ → เด้งกลับหาคนสร้าง ขึ้นคิวฝั่งเขา" ทำไม่ได้ถ้าไม่รู้ว่าใครสร้าง
-- updated_at = "แก้ข้อที่อนุมัติแล้ว = เด้งกลับรออนุมัติอัตโนมัติ" ต้องรู้ว่าถูกแก้เมื่อไหร่
CREATE TABLE items (
  id bigint PRIMARY KEY,
  module text NOT NULL,            -- listening | reading | vocab | grammar | minimal_pair
  item_type text NOT NULL,         -- mcq | match | true_false | pick_pinyin | listen_pick_image | word_order
  category smallint REFERENCES categories(id),
  stem text NOT NULL,              -- ข้อฟังห้ามใส่ข้อความของสิ่งที่ให้ฟัง (PR-02)
  choices jsonb,
  answer_key jsonb NOT NULL,       -- เฉลยตายตัว — ตรวจด้วย rule 100% (QZ-07)
  distractor_rationale jsonb,      -- ตัวลวงข้อไหนดัก Thai-L1 จุดไหน (PR-04) = เครื่องมือวิจัย
  audio_path text,
  hsk_level integer NOT NULL,
  status text NOT NULL,            -- STATUS5 (โฟลว์ 4.2)
  reject_reason text,
  created_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),   -- หฤทัยเท่านั้น (RO-03)
  approved_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz
);

-- Q-matrix — ไม่มีตารางนี้ BKT ไม่รู้จะอัปเดตทักษะไหน (BK-02)
CREATE TABLE item_skills (
  item_id bigint NOT NULL REFERENCES items(id),
  skill_id bigint NOT NULL REFERENCES skills(id),
  PRIMARY KEY (item_id, skill_id)
);

-- ข้อไหนอยู่ชุดไหน + ลำดับข้อในชุด (M:N — ข้อเดียวอยู่ได้หลายชุด เช่น pre=post)
-- migration ต้องเพิ่ม: UNIQUE (form_id, position)  ← กันข้อซ้ำตำแหน่งในชุดเดียวกัน
CREATE TABLE form_items (
  form_id bigint NOT NULL REFERENCES exam_forms(id),
  item_id bigint NOT NULL REFERENCES items(id),
  position smallint NOT NULL,
  PRIMARY KEY (form_id, item_id)
);

-- skill_id แทน kc_code เดิม (แก้ 21 ส.ค.) — ที่อื่นใช้ FK หมด ตัวนี้เคยเป็นข้อความลอย พิมพ์ผิดแล้วเงียบ
-- tokens = [cache] ลำดับคำเฉลยสำหรับแสดง/ตรวจคำตอบ · ตัวจริงของลำดับคำคือ sentence_words.position
CREATE TABLE sentences (
  id bigint PRIMARY KEY,
  category smallint REFERENCES categories(id),
  tokens jsonb NOT NULL,           -- [cache]
  pinyin text NOT NULL,
  meaning_th text NOT NULL,
  focus_th text,
  skill_id bigint REFERENCES skills(id),  -- KC ที่ประโยคนี้ฝึก (เดิมเป็น kc_code text)
  audio_path text,
  source_attribution text,         -- เครดิตถ้าดึงจาก Tatoeba (CC BY 2.0 FR) — ห้ามลืม
  status text NOT NULL,            -- STATUS5 (CG-01 ต้องผ่านหฤทัยก่อนเสิร์ฟ)
  created_at timestamptz NOT NULL,
  updated_at timestamptz
);

-- M:N ประโยค ↔ คำ — ตัวจริงของ "ประโยคนี้ใช้คำอะไร ลำดับไหน"
-- บังคับกฎ PA-07 "ใช้เฉพาะคำที่เรียนแล้ว" + RO-02 (เตือนก่อนลบคำที่ถูกอ้างอยู่)
CREATE TABLE sentence_words (
  sentence_id bigint NOT NULL REFERENCES sentences(id),
  word_id bigint NOT NULL REFERENCES words(id),
  position smallint NOT NULL,
  PRIMARY KEY (sentence_id, word_id, position)
);

-- เนื้อหาบทปูพื้นฐานเสียง (m0-1..m0-5) — เดิมไม่มีที่ไหนเลย
CREATE TABLE foundation_lessons (
  id bigint PRIMARY KEY,
  stage text NOT NULL REFERENCES foundation_stages(code),
  position smallint NOT NULL,
  title_th text NOT NULL,
  body_th text,
  audio_path text,
  status text NOT NULL,            -- STATUS5
  created_at timestamptz NOT NULL,
  updated_at timestamptz
);

-- คู่เสียงสำหรับเกมฝึกหู (PR-05 ~20 คู่: วรรณยุกต์ 2/3 ~10 + zh/ch/sh ~10)
-- หฤทัยคัดคู่และฟังยืนยันเสียง TTS ก่อนใช้ — ต้องแก้เองได้ผ่านหน้า Admin
-- เก็บ hanzi/pinyin ตรง ๆ เพราะบางคู่ (妈/马) ไม่ได้อยู่ในลิสต์ HSK1 300 คำทั้งคู่
CREATE TABLE minimal_pairs (
  id bigint PRIMARY KEY,
  skill_id bigint NOT NULL REFERENCES skills(id),  -- KC ที่คู่นี้ดัก (TL-TONE-* / TL-RETRO-*)
  hanzi_a text NOT NULL,
  pinyin_a text NOT NULL,
  audio_a_path text,
  word_a_id bigint REFERENCES words(id),           -- null ถ้าคำนั้นไม่ได้อยู่ใน 300 คำ
  hanzi_b text NOT NULL,
  pinyin_b text NOT NULL,
  audio_b_path text,
  word_b_id bigint REFERENCES words(id),
  note_th text,                                    -- อธิบายแบบคนไทยว่าต่างกันตรงไหน
  status text NOT NULL,                            -- STATUS5
  created_at timestamptz NOT NULL,
  updated_at timestamptz
);

-- "รอบการทำ" ตารางเดียวครอบทุกเครื่องมือวัด (แทน mock_exam_sessions เดิม)
-- ระบบมีเครื่องมือวัด 5 ชนิดที่รูปร่างเหมือนกันหมด (เริ่ม → ตอบหลายข้อ → จบ → ได้คะแนน):
--   micro_check 5 ข้อ (ON-09) · placement 10-15 ข้อ (PL-02) · pretest ครอบ 5 หมวด (PL-08)
--   quiz 10 ข้อ/หมวด (QZ-01) · mock 40 ข้อ (MK-01)  + practice/review ที่เป็นรอบฝึก
-- ⚠️ pretest แยกขาดจาก mock ตาม PL-03 ("pre-test แรกเข้า ≠ mock เต็ม 200") — คนละ kind
-- คะแนน mock ยกออกจาก detail jsonb มาเป็นคอลัมน์จริง (แก้ 21 ส.ค.)
--   เหตุผล: score_listening/score_reading/passed คือตัวเลขที่ query บ่อยที่สุดตอนวิเคราะห์ gain score
--   ฝังใน jsonb = index ไม่ได้ + เขียน query เทียบ pre/post ลำบาก ทั้งที่เป็นหัวใจของบทที่ 4
-- migration ต้องเพิ่ม: UNIQUE (user_id, kind, category, attempt_no)
CREATE TABLE sessions (
  id bigint PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  kind text NOT NULL,              -- micro_check|placement|pretest|quiz|practice|review|mock
  form_id bigint REFERENCES exam_forms(id),    -- null = ชุดที่ระบบสุ่มสด (quiz/practice)
  category smallint REFERENCES categories(id), -- null สำหรับ pretest/mock/placement
  mode text,                       -- โหมดฝึก: listen|read|order|match (null ถ้าเป็นโหมดสอบ)
  attempt_no smallint NOT NULL,    -- [cache] ครั้งที่เท่าไหร่ของ (user, kind, category) — QZ-09
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  status text NOT NULL,            -- running | done | abandoned (โฟลว์ §7-2: ค้าง >10 นาที = ทิ้งรอบ)
  total integer,                   -- [cache] นับจาก attempts ได้
  score integer,                   -- [cache]
  score_listening integer,         -- mock: ฟัง 100
  score_reading integer,           -- mock: อ่าน 100
  score_total integer,             -- mock: สเกล 200 (MK-01)
  passed boolean,                  -- mock: เกณฑ์จริง >= 120
  detail jsonb                     -- ที่เหลือที่ไม่ต้อง query (เช่น เวลาที่ใช้ต่อพาร์ต)
);

-- attempts — หัวใจของงานวิจัย (append-only ห้าม UPDATE/DELETE · BK-01)
--
-- ① event_type + is_correct nullable (แก้ 21 ส.ค.) — จุดที่จะพังจริงถ้าไม่แก้
--    เราวางแผนให้การพลิกบัตรคำ (generator='flashcard') เขียนลงตารางนี้ด้วย เพื่ออนุมานเป้า 10 คำ/วัน
--    แต่ "การเห็นคำใหม่" ไม่ใช่การตอบถูกหรือผิด — ถ้า is_correct เป็น NOT NULL ต้องยัดค่ามั่ว
--    แล้ว pyBKT จะกินแถวเหล่านั้นเป็นหลักฐานความแม่น = โมเดลเรียนจากข้อมูลขยะ
--    กติกา: BKT/AUC อ่านเฉพาะ event_type='graded' เท่านั้น
-- ② item_id ไม่บังคับ + word_id/sentence_id/generator
--    กิจกรรมส่วนใหญ่วันนี้ทำงานบน "คำ" ไม่ใช่ "ข้อสอบ" (บัตรคำ/ฝึก/จับคู่/ควิซที่ปั้นข้อสด)
--    ถ้าคงบังคับไว้ จะเขียน log ไม่ได้เลยจนกว่า item bank เสร็จ = ผูกงานโค้ดไว้กับงานเนื้อหา
-- ③ skill_id — จด KC ที่ข้อนี้วัด "ณ เวลาที่ตอบ" (ข้อปั้นสดไม่มี item_skills ให้เดิน)
--    ผลพลอยได้: แก้ Q-matrix ทีหลังแล้วข้อมูลทดลองเก่าไม่เปลี่ยนความหมายย้อนหลัง
CREATE TABLE attempts (
  id bigint PRIMARY KEY,
  client_attempt_id text NOT NULL UNIQUE,  -- idempotent sync (OF-01) · nullable ไม่ได้ ไม่งั้นกันซ้ำไม่จริง
  user_id uuid NOT NULL REFERENCES users(id),
  session_id bigint REFERENCES sessions(id),
  event_type text NOT NULL,        -- graded (ตอบข้อที่ตรวจได้) | exposure (เห็นคำ/พลิกบัตร)
  item_id bigint REFERENCES items(id),          -- ข้อสอบที่ผ่านการตรวจแล้ว
  word_id bigint REFERENCES words(id),          -- ข้อที่ระบบปั้นสดจากคำ
  sentence_id bigint REFERENCES sentences(id),  -- ข้อที่ปั้นจากประโยค
  skill_id bigint REFERENCES skills(id),        -- KC ณ เวลาตอบ (อาหารของ BKT)
  generator text,                  -- flashcard|listen_mc4|read_mc4|match|order|ear_game
  answer jsonb,
  is_correct boolean,              -- NULL เมื่อ event_type='exposure'
  answered_at timestamptz NOT NULL,
  time_spent_ms integer,           -- เก็บย้อนหลังไม่ได้ ต้องมีตั้งแต่แถวแรก (FS-04 + ablation)
  app_version text,                -- แก้บั๊กกลางการทดลอง = ต้องแยกข้อมูลก่อน/หลังแก้ได้
  context text NOT NULL            -- practice|review|quiz|pretest|placement|micro_check|mock
  -- migration จริงต้องเพิ่ม:
  --   CHECK (item_id IS NOT NULL OR word_id IS NOT NULL OR sentence_id IS NOT NULL)
  --   CHECK ((event_type='graded' AND is_correct IS NOT NULL)
  --       OR (event_type='exposure' AND is_correct IS NULL))
  --   RLS: user_id = auth.uid() · อนุญาตแค่ SELECT/INSERT (ห้าม UPDATE/DELETE = append-only)
  --   INDEX (user_id, skill_id, answered_at) WHERE event_type='graded'  ← query หลักของ pyBKT
);

-- สถานะ FSRS v6 ต่อ user-word — คอลัมน์ต้องครบตาม Card ของ ts-fsrs
-- (เดิมขาด elapsed_days/scheduled_days/learning_steps → sync client-server จะคำนวณนัดถัดไปไม่ตรงกัน)
CREATE TABLE review_states (
  user_id uuid NOT NULL REFERENCES users(id),
  word_id bigint NOT NULL REFERENCES words(id),
  difficulty real,
  stability real,
  due timestamptz,
  last_review timestamptz,
  elapsed_days integer,
  scheduled_days integer,
  learning_steps smallint,
  reps integer,
  lapses integer,
  state text,                      -- new | learning | review | relearning
  PRIMARY KEY (user_id, word_id)
);

-- ผล BKT posterior + ประวัติไว้พล็อตพัฒนาการ
-- bkt_run_id = snapshot นี้คำนวณด้วยโมเดลรอบไหน · ไม่มีอันนี้ กราฟพัฒนาการอาจผสมผลจากคนละโมเดล
CREATE TABLE mastery_snapshots (
  user_id uuid NOT NULL REFERENCES users(id),
  skill_id bigint NOT NULL REFERENCES skills(id),
  p_mastery real NOT NULL,
  bkt_run_id bigint REFERENCES bkt_training_runs(id),
  computed_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, skill_id, computed_at)
);

-- คลังจุดผิดคนไทย 15 KC (3 กลุ่ม × 5) — จุดขายหลัก เผยแพร่เป็น open dataset ได้
-- skill_id เป็น NOT NULL UNIQUE: KC จุดผิดที่ไม่ผูก skill = BKT ตามไม่ได้ = ไม่มีความหมาย
CREATE TABLE thai_l1_catalog (
  id bigint PRIMARY KEY,
  code text NOT NULL UNIQUE,       -- TL-TONE-T2AS3 ฯลฯ
  error_group text NOT NULL,       -- TL-TONE | TL-RETRO | TL-GRAM
  description_th text NOT NULL,
  example text,
  cause_th text,                   -- อธิบายด้วย L1 transfer
  remedy text,                     -- วิธีเจาะสอน
  evidence text,                   -- อ้างอิงงานวิจัยจริง — ห้ามแต่ง
  skill_id bigint NOT NULL UNIQUE REFERENCES skills(id)
);

-- ความคืบหน้าบทปูพื้นฐานเสียง — PA-01 ประตู 80% · PA-08 นับรอบที่ไม่ผ่าน
CREATE TABLE foundation_progress (
  user_id uuid NOT NULL REFERENCES users(id),
  stage text NOT NULL REFERENCES foundation_stages(code),
  tries smallint NOT NULL,
  best_accuracy real,
  passed_at timestamptz,
  PRIMARY KEY (user_id, stage)
);

-- บันทึกสิ่งที่ระบบ "แนะนำให้ฝึกเจาะ" (BK-03)
-- เหตุผลที่ต้องมี ไม่ใช่แค่เรื่องฟีเจอร์: ablation พิสูจน์ว่า "โมเดลแม่นขึ้น"
-- แต่ไม่ได้พิสูจน์ว่า "การวินิจฉัย Thai-L1 เปลี่ยนพฤติกรรมผู้เรียนจริง"
CREATE TABLE recommendations (
  id bigint PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  skill_id bigint NOT NULL REFERENCES skills(id),
  reason text NOT NULL,            -- low_mastery | quiz_fail | thai_l1_error
  p_mastery_at_time real,          -- ค่าที่ trigger (เทียบ threshold BK-04)
  created_at timestamptz NOT NULL,
  followed_session_id bigint REFERENCES sessions(id)  -- null = ผู้เรียนไม่ได้ทำตาม
);

-- บันทึกการโอนสิทธิ์อนุมัติ — โฟลว์ผู้ใช้ §7-6 "จดบันทึกการโอนทุกครั้ง"
-- เคสจริง: บัญชีหฤทัยใช้ไม่ได้ (ลืมรหัส/หลุด) แล้วต้องให้บอลอนุมัติแทนชั่วคราว
CREATE TABLE approval_transfers (
  id bigint PRIMARY KEY,
  from_user_id uuid NOT NULL REFERENCES users(id),
  to_user_id uuid NOT NULL REFERENCES users(id),
  reason text NOT NULL,
  granted_at timestamptz NOT NULL,
  revoked_at timestamptz
);
