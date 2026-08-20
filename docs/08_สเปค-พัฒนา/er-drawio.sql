-- ไฟล์สำหรับวาด ER ใน draw.io (diagrams.net)
-- วิธีใช้: draw.io → เมนูแทรก (Insert / ลูกศร+) → Advanced → SQL... → วางทั้งไฟล์นี้ → Insert
-- draw.io จะสร้างกล่อง entity ให้ครบทุกตาราง (แก้/จัดวาง/ลากเส้นความสัมพันธ์ต่อได้เอง)
-- ที่มา: docs/08_สเปค-พัฒนา/DATABASE-ER.md — ชั้น 1 = ใช้จริงวันนี้ · ชั้น 2 = พิมพ์เขียว m7-1 เป็นต้นไป

-- ===== ชั้นที่ 1: ใช้จริงวันนี้ (dump จาก Supabase จริง) =====

CREATE TABLE words (
  id bigint PRIMARY KEY,
  hanzi text NOT NULL UNIQUE,
  traditional text,
  pinyin text NOT NULL,
  pos text[],
  meaning_en jsonb,
  meaning_th text,
  th_reviewed boolean NOT NULL,
  hsk_level integer NOT NULL,
  category smallint,
  audio_path text,
  image_path text,
  etymology_image_path text,
  etymology_story_th text,
  wordlist_version text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE roadmap_state (
  item_id text PRIMARY KEY,
  done boolean NOT NULL,
  updated_at timestamptz NOT NULL
);

-- ===== ชั้นที่ 2: พิมพ์เขียวเมื่อมีล็อกอิน (m7-1+) — ตาม ARCHITECTURE §4 =====

CREATE TABLE users (
  id uuid PRIMARY KEY,
  display_name text,
  pdpa_consent_at timestamptz,
  target_level integer,
  exam_date date,
  audio_rate real,
  created_at timestamptz NOT NULL
);

CREATE TABLE skills (
  id bigint PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name_th text NOT NULL,
  type text NOT NULL,
  hsk_level integer NOT NULL,
  bkt_prior real,
  bkt_learn real,
  bkt_slip real,
  bkt_guess real
);

CREATE TABLE items (
  id bigint PRIMARY KEY,
  module text NOT NULL,
  item_type text NOT NULL,
  stem text NOT NULL,
  choices jsonb,
  answer_key jsonb NOT NULL,
  distractor_rationale jsonb,
  audio_path text,
  hsk_level integer NOT NULL,
  status text NOT NULL,
  reject_reason text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz
);

CREATE TABLE item_skills (
  item_id bigint NOT NULL REFERENCES items(id),
  skill_id bigint NOT NULL REFERENCES skills(id),
  PRIMARY KEY (item_id, skill_id)
);

CREATE TABLE attempts (
  id bigint PRIMARY KEY,
  client_attempt_id text UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id),
  item_id bigint NOT NULL REFERENCES items(id),
  answer jsonb,
  is_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL,
  time_spent_ms integer,
  context text NOT NULL,
  mock_exam_session_id bigint REFERENCES mock_exam_sessions(id)
);

CREATE TABLE review_states (
  user_id uuid NOT NULL REFERENCES users(id),
  word_id bigint NOT NULL REFERENCES words(id),
  difficulty real,
  stability real,
  due timestamptz,
  last_review timestamptz,
  reps integer,
  lapses integer,
  state text,
  PRIMARY KEY (user_id, word_id)
);

CREATE TABLE mastery_snapshots (
  user_id uuid NOT NULL REFERENCES users(id),
  skill_id bigint NOT NULL REFERENCES skills(id),
  p_mastery real NOT NULL,
  computed_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, skill_id, computed_at)
);

CREATE TABLE mock_exam_sessions (
  id bigint PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  kind text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  time_limit_s integer,
  score_listening integer,
  score_reading integer,
  score_total integer,
  passed boolean
);

CREATE TABLE thai_l1_catalog (
  id bigint PRIMARY KEY,
  code text NOT NULL UNIQUE,
  error_group text NOT NULL,
  description_th text NOT NULL,
  example text,
  cause_th text,
  remedy text,
  evidence text,
  skill_id bigint REFERENCES skills(id)
);

CREATE TABLE sentences (
  id bigint PRIMARY KEY,
  category smallint,
  tokens jsonb NOT NULL,
  pinyin text NOT NULL,
  meaning_th text NOT NULL,
  focus_th text,
  kc_code text,
  audio_path text,
  status text NOT NULL
);
