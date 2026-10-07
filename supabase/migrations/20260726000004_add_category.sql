-- 20260726000004_add_category.sql — (รันมือแล้ว 26 ก.ค. 2569 — ต้นฉบับ data/seeds/004_add_category.sql)
-- เปลี่ยนคอลัมน์หมวดเป็นเลข 1-5 (โครง 5 หมวด — หฤทัยอนุมัติ 26 ก.ค. 2026)
-- 1=ทักทาย&คนรอบตัว · 2=ตัวเลข เวลา&วันที่ · 3=กิน ดื่ม&ซื้อของ · 4=เรียน ทำงาน&สื่อสาร · 5=เดินทาง&ชีวิตประจำวัน
-- ฉบับ migration: ห่อด้วย DO ให้รันซ้ำได้ — ถ้าคอลัมน์เป็น smallint อยู่แล้ว (DB จริงวันนี้) จะข้ามขั้นแปลงชนิด
do $$
declare coltype text;
begin
  select data_type into coltype
    from information_schema.columns
   where table_schema = 'public' and table_name = 'words' and column_name = 'category';

  if coltype is null then
    alter table public.words add column category smallint;
  elsif coltype <> 'smallint' then
    alter table public.words drop constraint if exists words_category_check;
    alter table public.words alter column category type smallint
      using (case when category::text ~ '^[1-5]$' then category::text::smallint else null end);
  end if;
end $$;

alter table public.words drop constraint if exists words_category_check;
alter table public.words add constraint words_category_check check (category between 1 and 5);
comment on column public.words.category is 'หมวดเนื้อหา 1-5 (โครงที่หฤทัยอนุมัติ 26 ก.ค. 2026) — null = ยังไม่จัด (เช่นคำ HSK2 ในอนาคต)';
