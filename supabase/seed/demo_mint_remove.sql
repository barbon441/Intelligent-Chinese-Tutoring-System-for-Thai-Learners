-- demo_mint_remove.sql — ลบข้อมูลสาธิต "มิ้นท์ (บัญชีสาธิต)" ทั้งหมด (คู่กับ demo_mint.sql)
--   รัน: python scripts/db_apply.py supabase/seed/demo_mint_remove.sql    ← ทำก่อนเริ่มทดลองจริง
do $$
declare
  v_user uuid := '00000000-0000-4000-8000-0000000a0001';
begin
  alter table public.attempts disable trigger attempts_append_only;   -- append-only (BK-01) — ปิดชั่วคราวเฉพาะลบข้อมูลสาธิต
  delete from public.attempts where user_id = v_user;
  alter table public.attempts enable trigger attempts_append_only;
  delete from public.review_states     where user_id = v_user;
  delete from public.category_progress where user_id = v_user;
  delete from public.sessions          where user_id = v_user;
  delete from public.items             where distractor_rationale->>'seed' = 'demo-mint';
  delete from public.users             where id = v_user;
end $$;
