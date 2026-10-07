-- 20261007000005_schema_v1.sql — พิมพ์เขียว 24 ตาราง (docs/08_สเปค-พัฒนา/er-drawio.sql) ฉบับรันได้จริง
-- ที่มา: อาจารย์นัดรอบ 7 (1 ต.ค. 2569): "ขอ DB เป็นโค้ด ไม่ใช่รูป → เอาโค้ดไป create ตารางใน Supabase → แก้ด้วย migration"
-- กติกา: er-drawio.sql = ความจริงของ "โครง" (คอลัมน์/คีย์/เส้น) · ไฟล์นี้ = โครงเดียวกัน + สิ่งที่ผังไม่โชว์:
--   identity / default / CHECK / UNIQUE / INDEX / RLS / trigger — ตามคอมเมนต์ "migration ต้องเพิ่ม" ในไฟล์ต้นทาง
-- รันซ้ำได้ก่อน --apply · หลัง --apply แล้ว **ห้ามแก้ไฟล์นี้** — เปลี่ยนโครง = ไฟล์ใหม่ 2026MMDD…_*.sql เสมอ
-- รีวิว 7–8 ต.ค. (agent 2 มุม: ตรงต้นทาง · กฎธุรกิจ) → แก้แล้ว: client เขียน pre/post เองไม่ได้ · attempt_no เติมอัตโนมัติ ·
--   สถานะรอบเป็นปลายทาง · กัน pre/post ซ้ำตั้งแต่ insert · แช่แข็งทั้งสารบัญและเนื้อข้อ · users ไม่ผูก FK auth.users (ON-05) ฯลฯ
-- ⚠️ ของที่มีจริงก่อนหน้า (words · roadmap_state จาก 0001–0004) ใช้ ALTER เติม ไม่สร้างใหม่

begin;

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ตาราง append-only (BK-01): ห้าม UPDATE/DELETE ทุก role (ถ้าจำเป็นจริงให้ admin disable trigger ชั่วคราว)
-- ⚠️ ฝั่ง API ต้องใช้ INSERT … ON CONFLICT (client_attempt_id) DO NOTHING เท่านั้น (DO UPDATE จะชน trigger นี้)
create or replace function public.forbid_change() returns trigger
language plpgsql as $$
begin
  raise exception 'table % is append-only (BK-01) — % not allowed', tg_table_name, tg_op;
end $$;

-- role ของผู้เรียก: 'authenticated' / 'anon' (ผ่าน PostgREST) · null เมื่อเป็น postgres/service role ตรง ๆ
create or replace function public.is_client_role() returns boolean
language sql stable as $$
  select coalesce(auth.role(), '') in ('authenticated', 'anon');
$$;

-- ---------- ① categories (5 หมวด — หฤทัยอนุมัติ 26 ก.ค. 2569 · ลำดับง่าย→ยากตามตำรา PA-09) ----------
create table if not exists public.categories (
  id               smallint primary key check (id between 1 and 5),
  name_th          text not null,
  summary_th       text,
  difficulty_order smallint not null,
  word_count       smallint,                      -- [cache] นับจาก words (trigger อัปเดต)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);
insert into public.categories (id, name_th, summary_th, difficulty_order) values
  (1, 'ทักทาย & คนรอบตัว',       'สวัสดี แนะนำตัว ครอบครัว เพื่อน',     1),
  (2, 'ตัวเลข เวลา & วันที่',     'นับเลข บอกเวลา วัน เดือน ปี อายุ',   2),
  (3, 'กิน ดื่ม & ซื้อของ',       'สั่งอาหาร ถามราคา จ่ายเงิน',          3),
  (4, 'เรียน ทำงาน & สื่อสาร',    'โรงเรียน ที่ทำงาน โทรศัพท์',          4),
  (5, 'เดินทาง & ชีวิตประจำวัน',  'ถามทาง พาหนะ กิจวัตร อากาศ',          5)
on conflict (id) do update set name_th = excluded.name_th, summary_th = excluded.summary_th,
  difficulty_order = excluded.difficulty_order;
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();

-- words: เติมคอลัมน์แผน + ผูก FK หมวด (พิมพ์เขียว 3 ก.ย. "คำสังกัดหมวด")
alter table public.words add column if not exists review_status        text check (review_status in ('draft','pending','approved','rejected','suspended'));
alter table public.words add column if not exists reviewed_by          uuid;
alter table public.words add column if not exists reviewed_at          timestamptz;
alter table public.words add column if not exists image_path           text;
alter table public.words add column if not exists etymology_image_path text;
alter table public.words add column if not exists etymology_story_th   text;
alter table public.words add column if not exists updated_at           timestamptz;
update public.words set review_status = case when th_reviewed then 'approved' else 'pending' end where review_status is null;
alter table public.words drop constraint if exists words_category_fk;
alter table public.words add constraint words_category_fk foreign key (category) references public.categories(id);
create index if not exists words_category_idx on public.words (category);
drop trigger if exists words_set_updated_at on public.words;
create trigger words_set_updated_at before update on public.words for each row execute function public.set_updated_at();

-- categories.word_count [cache] — ให้ DB ดูแลเอง ไม่ปล่อย drift
create or replace function public.refresh_category_word_count() returns trigger
language plpgsql as $$
begin
  update public.categories c
     set word_count = (select count(*) from public.words w where w.category = c.id)
   where c.id in (coalesce(new.category, -1), coalesce(old.category, -1));
  return null;
end $$;
drop trigger if exists words_refresh_category_count on public.words;
create trigger words_refresh_category_count after insert or update of category or delete on public.words
  for each row execute function public.refresh_category_word_count();
update public.categories c set word_count = (select count(*) from public.words w where w.category = c.id);

-- ---------- users (โปรไฟล์ต่อยอดจาก Supabase Auth — id = auth.users.id · ไม่ผูก FK: ON-05 ลบบัญชี auth ได้โดยคงแถวนี้แบบนิรนาม) ----------
create table if not exists public.users (
  id               uuid primary key,
  display_name     text,
  role             text not null default 'learner' check (role in ('learner','admin','approver')),   -- RO-02/RO-03
  pdpa_consent_at  timestamptz,
  consent_version  text,
  target_level     integer check (target_level in (0, 1, 2)),     -- ON-02 ①: 1=HSK1 · 2=HSK2 · 0=ยังไม่คิดเรื่องสอบ · null=ข้าม
  exam_date        date,
  self_level       text check (self_level in ('cant_read','some_basics','studied_before','unsure')),  -- ON-02 ③ (28 ก.ย.) · studied_before รอเคาะ
  audio_rate       real,
  pinyin_hidden    boolean not null default false,
  cohort           text check (cohort in ('trial','team')),                                         -- ME-02 (แอดมินตั้ง)
  trial_started_at timestamptz,
  anonymized_at    timestamptz,                                                                     -- ON-05
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);
alter table public.users drop constraint if exists users_id_fkey;
drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users for each row execute function public.set_updated_at();

-- สมัครผ่าน Supabase Auth → สร้างแถวโปรไฟล์อัตโนมัติ (+ เติมให้บัญชีที่มีอยู่ก่อน)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.users (id, display_name)
select u.id, coalesce(u.raw_user_meta_data ->> 'display_name', split_part(coalesce(u.email, ''), '@', 1))
  from auth.users u
on conflict (id) do nothing;

-- ON-05 ถอนความยินยอม: ล้าง PII ในแถวนี้ คง id (attempts ยังครบ) · อีเมลใน auth.users ต้องล้างแยก (admin API)
create or replace function public.anonymize_user(uid uuid) returns void
language sql security definer set search_path = public as $$
  update public.users set display_name = null, exam_date = null, anonymized_at = now() where id = uid;
$$;
revoke all on function public.anonymize_user(uuid) from public, anon, authenticated;

-- words.reviewed_by → users (ทำได้หลังมี users แล้ว)
alter table public.words drop constraint if exists words_reviewed_by_fk;
alter table public.words add constraint words_reviewed_by_fk foreign key (reviewed_by) references public.users(id);

-- roadmap_state: ใครติ๊ก (RO-04 — จะล็อกสิทธิ์เขียนเมื่อหน้า /roadmap มีล็อกอิน)
alter table public.roadmap_state add column if not exists updated_by uuid references public.users(id);

-- ---------- ⑥ สมอง: bkt_training_runs → skills ----------
create table if not exists public.bkt_training_runs (
  id           bigint generated by default as identity primary key,
  run_at       timestamptz not null default now(),
  data_until   timestamptz not null,
  n_attempts   integer not null,
  n_users      integer not null,
  kc_count     smallint not null,
  variant      text not null check (variant in ('full','no_thai_l1','slam_benchmark')),
  split_seed   integer not null,
  auc          real,
  auc_by_skill jsonb,
  params       jsonb,                 -- ตัวจริงของค่า BKT ทุกทักษะในรอบนี้
  notes        text
);

create table if not exists public.skills (
  id         bigint generated by default as identity primary key,
  code       text not null unique,
  name_th    text not null,
  type       text not null check (type in ('thai_l1','vocab','skill','grammar','tone','consonant')),  -- CG-08: thai_l1 15 · vocab 5 · skill 3
  hsk_level  integer not null default 1,
  bkt_prior  real,                    -- [cache] จาก bkt_training_runs.params
  bkt_learn  real,
  bkt_slip   real,
  bkt_guess  real,
  bkt_run_id bigint references public.bkt_training_runs(id),
  created_at timestamptz not null default now()
);

-- ---------- ⑤ ปูพื้นฐานเสียง: foundation_stages ----------
create table if not exists public.foundation_stages (
  code                  text primary key,
  name_th               text not null,
  position              smallint not null unique,
  pass_threshold        numeric,      -- PA-01 (ear_game 0.80) · numeric กัน 0.8 ≠ 0.80000001 ของ real
  soft_gate_after_tries smallint      -- PA-08 ข้อเสนอ 3 รอบ — ยังไม่เคาะ (เป็น data แก้ได้ไม่ต้อง deploy)
);
insert into public.foundation_stages (code, name_th, position, pass_threshold, soft_gate_after_tries) values
  ('intro',     'กติกาภาษาจีนสำหรับคนไทย', 1, null, null),
  ('pinyin',    'พินอินเทียบเสียงไทย',       2, null, null),
  ('tones',     'วรรณยุกต์ 4 เสียง',         3, null, null),
  ('ear_game',  'เกมแยกเสียง (คู่เสียง)',    4, 0.80, 3),
  ('reference', 'ตารางอ้างอิงพินอิน',        5, null, null)
on conflict (code) do update set name_th = excluded.name_th, position = excluded.position,
  pass_threshold = excluded.pass_threshold, soft_gate_after_tries = excluded.soft_gate_after_tries;

-- ---------- ② ชุดข้อสอบ → ข้อ → Q-matrix → สารบัญ ----------
create table if not exists public.exam_forms (
  id                bigint generated by default as identity primary key,
  code              text not null,                                         -- 'HSK1-PREPOST-A' · ออกชุดใหม่ = code เดิม version +1
  version           smallint not null default 1,
  name_th           text not null,
  kind              text not null check (kind in ('pretest','mock')),      -- 28 ก.ย.: ตัด placement/micro_check · mock สงวนไว้
  hsk_level         integer not null default 1,
  item_count        integer,                                               -- [cache]
  time_limit_s      integer,
  locked_until      date,
  published_at      timestamptz,                                           -- แช่แข็งแล้ว ห้ามแก้ form_items / เนื้อข้อ
  research_use_only boolean not null default false,                       -- PL-09 ①
  status            text not null default 'draft' check (status in ('draft','pending','approved','rejected','suspended')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,
  unique (code, version),
  constraint exam_forms_pretest_research check (kind <> 'pretest' or research_use_only)   -- ชุดวิจัยต้องติดธงเสมอ
);
drop trigger if exists exam_forms_set_updated_at on public.exam_forms;
create trigger exam_forms_set_updated_at before update on public.exam_forms for each row execute function public.set_updated_at();

create table if not exists public.items (
  id                   bigint generated by default as identity primary key,
  module               text not null check (module in ('listening','reading','vocab','grammar','minimal_pair')),
  item_type            text not null check (item_type in ('mcq','match','true_false','pick_pinyin','listen_pick_image','word_order')),
  category             smallint references public.categories(id),
  stem                 text not null,
  choices              jsonb,
  answer_key           jsonb not null,                                     -- เฉลยตายตัว (QZ-07) — client ไม่เห็น (MK-04)
  distractor_rationale jsonb,
  audio_path           text,
  hsk_level            integer not null default 1,
  status               text not null default 'draft' check (status in ('draft','pending','approved','rejected','suspended')),
  reject_reason        text,
  created_by           uuid references public.users(id),
  approved_by          uuid references public.users(id),
  approved_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz
);
create index if not exists items_category_module_idx on public.items (category, module) where status = 'approved';
drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at before update on public.items for each row execute function public.set_updated_at();

create table if not exists public.item_skills (
  item_id  bigint not null references public.items(id) on delete cascade,
  skill_id bigint not null references public.skills(id),
  primary key (item_id, skill_id)
);

create table if not exists public.form_items (
  form_id  bigint not null references public.exam_forms(id) on delete cascade,
  item_id  bigint not null references public.items(id),
  position smallint not null,
  primary key (form_id, item_id),
  unique (form_id, position)
);

-- ---------- ④ เนื้อหา: sentences → sentence_words ----------
create table if not exists public.sentences (
  id                 bigint generated by default as identity primary key,
  category           smallint references public.categories(id),
  tokens             jsonb not null,                                       -- [cache] ลำดับคำเฉลย
  pinyin             text not null,
  meaning_th         text not null,
  focus_th           text,
  skill_id           bigint references public.skills(id),
  audio_path         text,
  source_attribution text,
  status             text not null default 'draft' check (status in ('draft','pending','approved','rejected','suspended')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz
);
create index if not exists sentences_category_idx on public.sentences (category) where status = 'approved';
drop trigger if exists sentences_set_updated_at on public.sentences;
create trigger sentences_set_updated_at before update on public.sentences for each row execute function public.set_updated_at();

create table if not exists public.sentence_words (
  sentence_id bigint not null references public.sentences(id) on delete cascade,
  word_id     bigint not null references public.words(id),               -- RO-02: ลบคำที่ถูกอ้างอยู่ไม่ได้
  position    smallint not null,
  primary key (sentence_id, word_id, position),
  unique (sentence_id, position)
);
create index if not exists sentence_words_word_idx on public.sentence_words (word_id);

-- ---------- ⑤ ปูพื้นฐานเสียง: foundation_lessons · minimal_pairs ----------
create table if not exists public.foundation_lessons (
  id         bigint generated by default as identity primary key,
  stage      text not null references public.foundation_stages(code),
  position   smallint not null,
  title_th   text not null,
  body_th    text,
  audio_path text,
  status     text not null default 'draft' check (status in ('draft','pending','approved','rejected','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (stage, position)
);
drop trigger if exists foundation_lessons_set_updated_at on public.foundation_lessons;
create trigger foundation_lessons_set_updated_at before update on public.foundation_lessons for each row execute function public.set_updated_at();

create table if not exists public.minimal_pairs (
  id           bigint generated by default as identity primary key,
  skill_id     bigint not null references public.skills(id),
  hanzi_a      text not null,
  pinyin_a     text not null,
  audio_a_path text,
  word_a_id    bigint references public.words(id),
  hanzi_b      text not null,
  pinyin_b     text not null,
  audio_b_path text,
  word_b_id    bigint references public.words(id),
  note_th      text,
  status       text not null default 'draft' check (status in ('draft','pending','approved','rejected','suspended')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);
drop trigger if exists minimal_pairs_set_updated_at on public.minimal_pairs;
create trigger minimal_pairs_set_updated_at before update on public.minimal_pairs for each row execute function public.set_updated_at();

-- ---------- ③ รอบ (sessions) → คำตอบรายข้อ (attempts) ----------
create table if not exists public.sessions (
  id              bigint generated by default as identity primary key,
  user_id         uuid not null references public.users(id),
  kind            text not null check (kind in ('pretest','posttest','quiz','practice','review','mock')),
  form_id         bigint references public.exam_forms(id),
  category        smallint references public.categories(id),
  mode            text check (mode in ('listen','read','order','match')),
  attempt_no      smallint not null default 1,                              -- [cache] DB เติมเองตอน insert
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  status          text not null default 'running' check (status in ('running','done','abandoned')),
  total           integer,
  score           integer,
  score_listening integer,
  score_reading   integer,
  score_total     integer,
  passed          boolean,
  detail          jsonb,
  constraint sessions_prepost_no_category check (kind not in ('pretest','posttest') or category is null),
  constraint sessions_prepost_has_form    check (kind not in ('pretest','posttest') or form_id is not null),
  constraint sessions_done_has_finished   check (status <> 'done' or finished_at is not null)
);
-- QZ-09 ครั้งที่เท่าไหร่ของ (user, kind, category) · category ว่าง (pre/post/ฝึกรวม) ใช้ 0 แทน
create unique index if not exists sessions_attempt_uq on public.sessions (user_id, kind, coalesce(category, 0), attempt_no);
-- PL-10 §2.1: pre 1 ครั้ง · post 1 ครั้ง ต่อคน · ค้างได้ทีละรอบ
create unique index if not exists sessions_one_pretest_done     on public.sessions (user_id) where kind = 'pretest'  and status = 'done';
create unique index if not exists sessions_one_posttest_done    on public.sessions (user_id) where kind = 'posttest' and status = 'done';
create unique index if not exists sessions_one_running_prepost  on public.sessions (user_id, kind) where kind in ('pretest','posttest') and status = 'running';
create index if not exists sessions_user_kind_idx on public.sessions (user_id, kind, started_at desc);
create index if not exists sessions_form_idx on public.sessions (form_id) where form_id is not null;

-- attempt_no: DB นับต่อจากรอบก่อนของ user × kind × หมวด (รวม abandoned) — ค่าที่ client ส่งมาถูกทับ
create or replace function public.sessions_set_attempt_no() returns trigger
language plpgsql as $$
begin
  select coalesce(max(s.attempt_no), 0) + 1 into new.attempt_no
    from public.sessions s
   where s.user_id = new.user_id and s.kind = new.kind
     and coalesce(s.category, 0) = coalesce(new.category, 0);
  return new;
end $$;
drop trigger if exists sessions_set_attempt_no on public.sessions;
create trigger sessions_set_attempt_no before insert on public.sessions
  for each row execute function public.sessions_set_attempt_no();

-- done/abandoned ต้องมีเวลาจบ — DB เติมให้ถ้าแอปไม่ส่ง (BEFORE trigger รันก่อน CHECK)
create or replace function public.sessions_fill_finished_at() returns trigger
language plpgsql as $$
begin
  if new.status in ('done','abandoned') and new.finished_at is null then
    new.finished_at := now();
  end if;
  return new;
end $$;
drop trigger if exists sessions_fill_finished_at on public.sessions;
create trigger sessions_fill_finished_at before insert or update of status on public.sessions
  for each row execute function public.sessions_fill_finished_at();

-- PL-10 §2.1 + PL-09: กัน pre/post ซ้ำตั้งแต่ insert · post ต้องใช้ชุดเดียวกับ pre ของคนเดียวกัน และ pre ต้อง done ก่อน
create or replace function public.sessions_posttest_guard() returns trigger
language plpgsql as $$
declare pre_form bigint;
begin
  if tg_op = 'INSERT' and new.kind in ('pretest','posttest') and exists (
       select 1 from public.sessions s
        where s.user_id = new.user_id and s.kind = new.kind and s.status = 'done') then
    raise exception '% already completed for user % — 1 ครั้งต่อคน (PL-10 §2.1)', new.kind, new.user_id;
  end if;
  if new.kind = 'posttest' then
    select s.form_id into pre_form
      from public.sessions s
     where s.user_id = new.user_id and s.kind = 'pretest' and s.status = 'done'
     order by s.finished_at desc limit 1;
    if pre_form is null then
      raise exception 'posttest requires a completed pretest for user % (PL-10)', new.user_id;
    end if;
    if new.form_id is null then
      new.form_id := pre_form;
    elsif new.form_id <> pre_form then
      raise exception 'posttest form_id % must equal pretest form_id % (PL-09 ชุดเดียว)', new.form_id, pre_form;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists sessions_posttest_guard on public.sessions;
create trigger sessions_posttest_guard before insert or update of kind, form_id on public.sessions
  for each row execute function public.sessions_posttest_guard();

-- สถานะปลายทางแก้ไม่ได้ · คอลัมน์ระบุตัวรอบแก้ไม่ได้ (ทุก role — service role อยากแก้ให้ disable trigger ชั่วคราว)
create or replace function public.sessions_state_guard() returns trigger
language plpgsql as $$
begin
  if old.status <> 'running' and new.status is distinct from old.status then
    raise exception 'session % is % — terminal state (PL-10 §2.1)', old.id, old.status;
  end if;
  if new.user_id <> old.user_id or new.kind <> old.kind or new.attempt_no <> old.attempt_no
     or new.category is distinct from old.category or new.form_id is distinct from old.form_id then
    raise exception 'session %: user_id/kind/form_id/category/attempt_no are immutable', old.id;
  end if;
  return new;
end $$;
drop trigger if exists sessions_state_guard on public.sessions;
create trigger sessions_state_guard before update on public.sessions
  for each row execute function public.sessions_state_guard();

-- กฎแช่แข็ง (PL-09 / MK-02): ชุดที่ published_at แล้ว *หรือมีคนทำไปแล้ว* ห้ามแก้สารบัญและเนื้อข้อ → ออก version ใหม่แทน
create or replace function public.exam_form_is_frozen(fid bigint) returns boolean
language sql stable as $$
  select fid is not null and (
         exists (select 1 from public.exam_forms f where f.id = fid and f.published_at is not null)
      or exists (select 1 from public.sessions s where s.form_id = fid));
$$;
create or replace function public.form_items_frozen() returns trigger
language plpgsql as $$
begin
  if (tg_op in ('UPDATE','DELETE') and public.exam_form_is_frozen(old.form_id))
     or (tg_op in ('INSERT','UPDATE') and public.exam_form_is_frozen(new.form_id)) then
    raise exception 'exam_form is frozen (PL-09) — form_items cannot change; create a new version instead';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists form_items_frozen on public.form_items;
create trigger form_items_frozen before insert or update or delete on public.form_items
  for each row execute function public.form_items_frozen();

create or replace function public.items_frozen_in_form() returns trigger
language plpgsql as $$
begin
  if (new.stem, new.choices, new.answer_key, new.audio_path, new.item_type, new.module)
     is distinct from (old.stem, old.choices, old.answer_key, old.audio_path, old.item_type, old.module)
     and exists (select 1 from public.form_items fi where fi.item_id = old.id and public.exam_form_is_frozen(fi.form_id)) then
    raise exception 'item % is in a frozen exam_form (PL-09) — create a new item + new form version', old.id;
  end if;
  return new;
end $$;
drop trigger if exists items_frozen_in_form on public.items;
create trigger items_frozen_in_form before update on public.items
  for each row execute function public.items_frozen_in_form();

-- RO-03: อนุมัติข้อได้เฉพาะ approver (หรือผู้รับโอนสิทธิ์ที่ยังไม่ถูกเพิกถอน)
create or replace function public.items_approver_guard() returns trigger
language plpgsql as $$
begin
  if new.status = 'approved' and new.status is distinct from old.status then
    if new.approved_by is null or not exists (
         select 1 from public.users u
          where u.id = new.approved_by
            and (u.role = 'approver'
                 or exists (select 1 from public.approval_transfers t where t.to_user_id = u.id and t.revoked_at is null))) then
      raise exception 'items.approved_by must be the approver or an active transferee (RO-03)';
    end if;
    new.approved_at := coalesce(new.approved_at, now());
  end if;
  return new;
end $$;

create table if not exists public.category_progress (
  user_id          uuid not null references public.users(id),
  category         smallint not null references public.categories(id),
  started_at       timestamptz,
  words_learned    smallint,          -- [cache] นับจาก review_states
  sentences_passed smallint,          -- [cache] นับจาก sentence_states
  quiz_best_score  smallint,          -- [cache] จาก sessions kind=quiz (server เขียน)
  quiz_passed_at   timestamptz,       -- QZ-12 ปลดล็อกหมวดถัดไป (server เขียน)
  status           text not null default 'not_started' check (status in ('not_started','learning','quiz_passed')),
  primary key (user_id, category)
);
-- QZ-12: client ตั้ง quiz_passed / คะแนนควิซเองไม่ได้ — ต้องมาจากผลควิซฝั่ง server
create or replace function public.category_progress_guard() returns trigger
language plpgsql as $$
begin
  if public.is_client_role() then
    if new.status = 'quiz_passed' and (tg_op = 'INSERT' or old.status is distinct from 'quiz_passed') then
      raise exception 'category_progress.status=quiz_passed is set by the server only (QZ-12)';
    end if;
    if tg_op = 'INSERT' and (new.quiz_passed_at is not null or new.quiz_best_score is not null) then
      raise exception 'quiz fields are set by the server only (QZ-08/QZ-12)';
    end if;
    if tg_op = 'UPDATE' and (new.quiz_passed_at is distinct from old.quiz_passed_at
                             or new.quiz_best_score is distinct from old.quiz_best_score) then
      raise exception 'quiz fields are set by the server only (QZ-08/QZ-12)';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists category_progress_guard on public.category_progress;
create trigger category_progress_guard before insert or update on public.category_progress
  for each row execute function public.category_progress_guard();

create table if not exists public.attempts (
  id                bigint generated by default as identity primary key,
  client_attempt_id text not null unique,                                 -- OF-01 idempotent (API: ON CONFLICT DO NOTHING)
  user_id           uuid not null references public.users(id),
  session_id        bigint references public.sessions(id),
  event_type        text not null check (event_type in ('graded','exposure','asr_hint')),
  item_id           bigint references public.items(id),
  word_id           bigint references public.words(id),
  sentence_id       bigint references public.sentences(id),
  skill_id          bigint references public.skills(id),                   -- KC ณ เวลาตอบ
  generator         text check (generator in ('flashcard','listen_mc4','read_mc4','match','order','ear_game','speak_along')),
  answer            jsonb,
  is_correct        boolean,
  answered_at       timestamptz not null default now(),
  time_spent_ms     integer check (time_spent_ms is null or time_spent_ms >= 0),
  app_version       text,
  context           text not null check (context in ('practice','review','quiz','pretest','posttest','mock')),
  constraint attempts_has_target check (item_id is not null or word_id is not null or sentence_id is not null),
  constraint attempts_graded_consistency check (
       (event_type = 'graded'   and is_correct is not null and generator is distinct from 'speak_along')
    or (event_type = 'exposure' and is_correct is null)
    or (event_type = 'asr_hint' and is_correct is null and generator = 'speak_along')   -- ผล ASR เบื้องต้น ห้ามตัดสินถูก/ผิด · BKT ไม่อ่าน
  )
);
create index if not exists attempts_bkt_idx       on public.attempts (user_id, skill_id, answered_at)
  where event_type = 'graded' and context not in ('pretest','posttest');                 -- PL-10 §2.5: BKT ไม่กิน pre/post
create index if not exists attempts_session_idx   on public.attempts (session_id);
create index if not exists attempts_user_time_idx on public.attempts (user_id, answered_at desc);
create index if not exists attempts_word_idx      on public.attempts (word_id) where word_id is not null;
create index if not exists attempts_sentence_idx  on public.attempts (sentence_id) where sentence_id is not null;
drop trigger if exists attempts_append_only on public.attempts;
create trigger attempts_append_only before update or delete on public.attempts for each row execute function public.forbid_change();

-- context ต้องตรง kind ของรอบ (query ①② อาศัยสองช่องนี้ตรงกัน)
create or replace function public.attempts_context_guard() returns trigger
language plpgsql as $$
declare k text;
begin
  if new.session_id is not null then
    select kind into k from public.sessions where id = new.session_id;
    if k is distinct from new.context then
      raise exception 'attempts.context % <> sessions.kind % (session %)', new.context, k, new.session_id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists attempts_context_guard on public.attempts;
create trigger attempts_context_guard before insert on public.attempts
  for each row execute function public.attempts_context_guard();

-- ---------- ④ สมุดพกรายคน: review_states (คน×คำ) · sentence_states (คน×ประโยค) ----------
create table if not exists public.review_states (
  user_id        uuid not null references public.users(id),
  word_id        bigint not null references public.words(id),
  difficulty     real,
  stability      real,
  due            timestamptz,
  last_review    timestamptz,
  elapsed_days   integer,
  scheduled_days integer,
  learning_steps smallint,
  reps           integer not null default 0,
  lapses         integer not null default 0,
  state          text check (state in ('new','learning','review','relearning')),
  primary key (user_id, word_id)
);
create index if not exists review_states_due_idx on public.review_states (user_id, due);

create table if not exists public.sentence_states (
  user_id      uuid not null references public.users(id),
  sentence_id  bigint not null references public.sentences(id),
  tries        smallint not null default 0,
  best_correct boolean not null default false,
  last_at      timestamptz,
  passed_at    timestamptz,
  primary key (user_id, sentence_id)
);

-- ---------- ⑥ สมอง: mastery_snapshots (คน×ทักษะ) · thai_l1_catalog ----------
create table if not exists public.mastery_snapshots (
  user_id     uuid not null references public.users(id),
  skill_id    bigint not null references public.skills(id),
  p_mastery   real not null check (p_mastery between 0 and 1),
  bkt_run_id  bigint references public.bkt_training_runs(id),
  computed_at timestamptz not null default now(),
  primary key (user_id, skill_id, computed_at)   -- รูปทรงปัจจุบัน (รอบอลเคาะ: คงประวัติ / ลดรูปเหลือค่าล่าสุด)
);

create table if not exists public.thai_l1_catalog (
  id             bigint generated by default as identity primary key,
  code           text not null unique,
  error_group    text not null check (error_group in ('TL-TONE','TL-RETRO','TL-GRAM')),
  description_th text not null,
  example        text,
  cause_th       text,
  remedy         text,
  evidence       text,
  skill_id       bigint not null unique references public.skills(id)
);

-- ---------- ⑤ สมุดพก คน×ด่าน ----------
create table if not exists public.foundation_progress (
  user_id       uuid not null references public.users(id),
  stage         text not null references public.foundation_stages(code),
  tries         smallint not null default 0,
  best_accuracy numeric,              -- เทียบกับ pass_threshold (numeric ทั้งคู่)
  passed_at     timestamptz,
  primary key (user_id, stage)
);

-- ---------- หลังบ้าน ----------
create table if not exists public.approval_transfers (
  id           bigint generated by default as identity primary key,
  from_user_id uuid not null references public.users(id),
  to_user_id   uuid not null references public.users(id),
  reason       text not null,
  granted_at   timestamptz not null default now(),
  revoked_at   timestamptz
);
-- (ต้องสร้างหลัง approval_transfers เพราะฟังก์ชันอ้างถึง)
drop trigger if exists items_approver_guard on public.items;
create trigger items_approver_guard before update of status on public.items
  for each row execute function public.items_approver_guard();

-- ======================================================================
-- RLS (ตาม DATABASE-ER.md "นโยบายความปลอดภัย" + PL-10 §2.7: pre/post เขียนผ่าน service role เท่านั้น)
--   ตารางรายผู้ใช้  : เห็นของตัวเอง · เขียนได้เฉพาะรอบฝึก/ควิซ · attempts ไม่มี UPDATE/DELETE
--   ตารางเนื้อหา    : อ่านสาธารณะ (เฉพาะแถว approved ถ้ามี status) · เขียนผ่าน service role เท่านั้น
--   exam_forms/form_items/bkt_training_runs/approval_transfers : ไม่เปิดให้ client (service role เท่านั้น)
-- ======================================================================
alter table public.users               enable row level security;
alter table public.sessions            enable row level security;
alter table public.attempts            enable row level security;
alter table public.review_states       enable row level security;
alter table public.sentence_states     enable row level security;
alter table public.category_progress   enable row level security;
alter table public.foundation_progress enable row level security;
alter table public.mastery_snapshots   enable row level security;
alter table public.categories          enable row level security;
alter table public.skills              enable row level security;
alter table public.thai_l1_catalog     enable row level security;
alter table public.foundation_stages   enable row level security;
alter table public.foundation_lessons  enable row level security;
alter table public.minimal_pairs       enable row level security;
alter table public.sentences           enable row level security;
alter table public.sentence_words      enable row level security;
alter table public.items               enable row level security;
alter table public.item_skills         enable row level security;
alter table public.exam_forms          enable row level security;
alter table public.form_items          enable row level security;
alter table public.bkt_training_runs   enable row level security;
alter table public.approval_transfers  enable row level security;

-- users: เห็น/แก้ของตัวเอง · role/cohort/trial/anonymized แก้ได้เฉพาะ service role (สิทธิ์ระดับคอลัมน์)
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users for select using (id = auth.uid());
drop policy if exists users_insert_own on public.users;
create policy users_insert_own on public.users for insert with check (id = auth.uid() and role = 'learner' and cohort is null);
drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.users from anon, authenticated;
grant update (display_name, pdpa_consent_at, consent_version, target_level, exam_date, self_level, audio_rate, pinyin_hidden)
  on public.users to authenticated;

-- sessions: client สร้าง/แก้ได้เฉพาะรอบฝึก/ควิซ · pre/post/mock ผ่าน FastAPI (service role) เท่านั้น
drop policy if exists sessions_select_own on public.sessions;
create policy sessions_select_own on public.sessions for select using (user_id = auth.uid());
drop policy if exists sessions_insert_own on public.sessions;
create policy sessions_insert_own on public.sessions for insert
  with check (user_id = auth.uid() and kind in ('quiz','practice','review'));
drop policy if exists sessions_update_own on public.sessions;
create policy sessions_update_own on public.sessions for update
  using (user_id = auth.uid() and kind in ('quiz','practice','review'))
  with check (user_id = auth.uid() and kind in ('quiz','practice','review'));

-- attempts (append-only): client จดได้เฉพาะรอบฝึก/ควิซของตัวเอง
drop policy if exists attempts_select_own on public.attempts;
create policy attempts_select_own on public.attempts for select using (user_id = auth.uid());
drop policy if exists attempts_insert_own on public.attempts;
create policy attempts_insert_own on public.attempts for insert
  with check (
    user_id = auth.uid()
    and context in ('practice','review','quiz')
    and (session_id is null or exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid()))
  );

-- review_states / sentence_states / foundation_progress: ของตัวเอง อ่าน-เพิ่ม-แก้ (sync จาก client · server-wins ตาม ARCHITECTURE)
drop policy if exists review_states_own on public.review_states;
create policy review_states_own on public.review_states for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists sentence_states_own on public.sentence_states;
create policy sentence_states_own on public.sentence_states for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists foundation_progress_own on public.foundation_progress;
create policy foundation_progress_own on public.foundation_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- category_progress: ของตัวเอง แต่ quiz_passed/คะแนนควิซ server เท่านั้น (trigger category_progress_guard)
drop policy if exists category_progress_own on public.category_progress;
create policy category_progress_own on public.category_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- mastery_snapshots: อ่านของตัวเอง · เขียนโดยโมเดล (service role) เท่านั้น
drop policy if exists mastery_snapshots_select_own on public.mastery_snapshots;
create policy mastery_snapshots_select_own on public.mastery_snapshots for select using (user_id = auth.uid());

-- ตารางเนื้อหา: อ่านสาธารณะ
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select using (true);
drop policy if exists skills_public_read on public.skills;
create policy skills_public_read on public.skills for select using (true);
drop policy if exists thai_l1_catalog_public_read on public.thai_l1_catalog;
create policy thai_l1_catalog_public_read on public.thai_l1_catalog for select using (true);
drop policy if exists foundation_stages_public_read on public.foundation_stages;
create policy foundation_stages_public_read on public.foundation_stages for select using (true);
drop policy if exists foundation_lessons_public_read on public.foundation_lessons;
create policy foundation_lessons_public_read on public.foundation_lessons for select using (status = 'approved');
drop policy if exists minimal_pairs_public_read on public.minimal_pairs;
create policy minimal_pairs_public_read on public.minimal_pairs for select using (status = 'approved');
drop policy if exists sentences_public_read on public.sentences;
create policy sentences_public_read on public.sentences for select using (status = 'approved');
drop policy if exists sentence_words_public_read on public.sentence_words;
create policy sentence_words_public_read on public.sentence_words for select using (true);
drop policy if exists item_skills_public_read on public.item_skills;
create policy item_skills_public_read on public.item_skills for select using (true);

-- items: client อ่านได้เฉพาะข้อที่อนุมัติ และ "ไม่เห็นเฉลย" (MK-04) — อ่านผ่าน view items_public (select('*') บนตารางตรงจะถูกปฏิเสธ)
drop policy if exists items_public_read on public.items;
create policy items_public_read on public.items for select using (status = 'approved');
revoke all on public.items from anon, authenticated;
grant select (id, module, item_type, category, stem, choices, audio_path, hsk_level, status, created_at)
  on public.items to anon, authenticated;
create or replace view public.items_public with (security_invoker = true) as
  select id, module, item_type, category, stem, choices, audio_path, hsk_level, status, created_at
    from public.items where status = 'approved';
grant select on public.items_public to anon, authenticated;

-- ตารางที่ client ไม่ควรแตะเลย: เปิด RLS โดยไม่มี policy = ปิดทุกทาง · service role ข้าม RLS ได้ตามปกติ
revoke all on public.exam_forms        from anon, authenticated;
revoke all on public.form_items        from anon, authenticated;
revoke all on public.bkt_training_runs from anon, authenticated;
revoke all on public.approval_transfers from anon, authenticated;

commit;
