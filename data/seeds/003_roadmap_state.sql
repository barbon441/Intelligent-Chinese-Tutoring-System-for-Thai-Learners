-- ตารางเก็บสถานะติ๊ก checklist หน้า /roadmap (แชร์กันทั้งทีม)
-- โครงรายการอยู่ในโค้ด (apps/web/src/data/roadmap.ts) — ตารางนี้เก็บเฉพาะ "ติ๊กแล้วหรือยัง" ต่อ item
create table if not exists public.roadmap_state (
  item_id    text primary key,
  done       boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.roadmap_state enable row level security;

-- เปิดอ่าน+เขียนสาธารณะไปก่อน (ข้อมูล dev-progress ไม่อ่อนไหว)
-- ⚠️ TODO ส.ค.: พอมีระบบ Member/Admin แล้ว จำกัดการเขียนเฉพาะ admin
drop policy if exists "roadmap_state public read" on public.roadmap_state;
create policy "roadmap_state public read" on public.roadmap_state for select using (true);

drop policy if exists "roadmap_state public insert" on public.roadmap_state;
create policy "roadmap_state public insert" on public.roadmap_state for insert with check (true);

drop policy if exists "roadmap_state public update" on public.roadmap_state;
create policy "roadmap_state public update" on public.roadmap_state for update using (true);
