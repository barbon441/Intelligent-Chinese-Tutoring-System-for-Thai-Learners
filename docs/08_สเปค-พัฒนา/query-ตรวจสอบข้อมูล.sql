-- ============================================================================
--  query-ตรวจสอบข้อมูล.sql — 星航
--  ขั้น 5 (Validate) ของกระบวนการออกแบบฐานข้อมูล + ควิซเฝ้าระวังระหว่างการทดลอง
-- ============================================================================
--  ที่มา: เช็กลิสต์ "คำถามที่ฐานข้อมูลต้องตอบได้" ใน ความต้องการข้อมูล-User-Journey.md §4
--  schema: er-drawio.sql (23 ตาราง)
--
--  ทำไมต้องมีไฟล์นี้:
--   ① ขั้น 5 คือขั้นที่พิสูจน์ว่า ER ออกแบบครบจริง — ถ้ามีคำถามไหนเขียน query ไม่ได้
--     แปลว่าออกแบบตกอะไรไป และตอนนี้ยังแก้ฟรีเพราะยังไม่มีข้อมูล
--   ② ตัวเลขทุกตัวในบทที่ 4 ต้องมาจาก query ที่รันซ้ำได้ ไม่ใช่ตัวเลขที่กดจากหน้าจอแล้วจดใส่กระดาษ
--   ③ ควิซ ⑤ ต้องรัน "ทุกวันระหว่างทดลอง" ไม่ใช่รันตอนจบ — ดูเหตุผลในหัวข้อนั้น
--
--  หมายเหตุ: schema ยังไม่ถูกสร้างจริงใน Supabase (2/23 ตาราง ณ 21 ส.ค.)
--            ไฟล์นี้เขียนไว้ล่วงหน้าเพื่อ "ตรวจแบบ" ไม่ใช่เพื่อรันวันนี้
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- ① Gain score รายคน — หลักฐานหลักของโครงงาน (ME-02)
-- ────────────────────────────────────────────────────────────────────────────
-- บรรทัด post.form_id = pre.form_id คือสิ่งที่บังคับมติ "pre = post ชุดเดียวกัน" (PL-07)
-- ในระดับข้อมูล ไม่ใช่แค่ความตั้งใจ — ถ้าใครเผลอใช้คนละชุด แถวนั้นจะหายไปจากผลเอง
SELECT u.display_name,
       pre.score_total                     AS pre_score,
       post.score_total                    AS post_score,
       post.score_total - pre.score_total  AS gain,
       post.passed,                        -- เกณฑ์จริง >= 120 จาก 200 (MK-01)
       f.code                              AS form_used,
       post.started_at::date - u.trial_started_at::date AS days_in_trial
FROM users u
JOIN sessions pre  ON pre.user_id  = u.id AND pre.kind  = 'pretest' AND pre.status = 'done'
JOIN sessions post ON post.user_id = u.id AND post.kind = 'mock'    AND post.status = 'done'
                  AND post.form_id = pre.form_id
JOIN exam_forms f  ON f.id = pre.form_id
WHERE u.cohort = 'trial'
ORDER BY gain DESC;


-- ────────────────────────────────────────────────────────────────────────────
-- ② ผ่าน/ไม่ผ่าน "รายทักษะ" คิดเป็น % — สิ่งที่อาจารย์ขอจริง ๆ (PL-03)
-- ────────────────────────────────────────────────────────────────────────────
-- คำพูดอาจารย์นัดรอบ 3: "ไม่ใช่นับผ่านกี่คน — ดูว่าแต่ละคนผ่าน/ไม่ผ่านทักษะไหน คิดเป็น %"
-- event_type='graded' สำคัญมาก: ตัดแถวการพลิกบัตรคำ (exposure) ออก ไม่งั้น % จะเพี้ยน
SELECT u.display_name,
       sk.name_th AS skill,
       ROUND(100.0 * AVG(CASE WHEN s.kind = 'pretest' THEN a.is_correct::int END), 1) AS pre_pct,
       ROUND(100.0 * AVG(CASE WHEN s.kind = 'mock'    THEN a.is_correct::int END), 1) AS post_pct,
       COUNT(*) FILTER (WHERE s.kind = 'pretest') AS n_pre,
       COUNT(*) FILTER (WHERE s.kind = 'mock')    AS n_post
FROM attempts a
JOIN sessions s  ON s.id  = a.session_id
JOIN skills   sk ON sk.id = a.skill_id
JOIN users    u  ON u.id  = a.user_id
WHERE a.event_type = 'graded'
  AND s.kind IN ('pretest', 'mock')
  AND s.status = 'done'
  AND u.cohort = 'trial'
GROUP BY u.display_name, sk.name_th
ORDER BY u.display_name, post_pct - pre_pct DESC;


-- ────────────────────────────────────────────────────────────────────────────
-- ③ คะแนนเก็บ 50 คะแนน — ครั้งที่ดีที่สุดต่อหมวด (QZ-08 / QZ-09)
-- ────────────────────────────────────────────────────────────────────────────
-- status='done' คือจุดที่ตาราง sessions คุ้มค่า: รอบที่ทิ้งกลางคันไม่ถูกนับเป็นคะแนน
-- (ถ้าไม่มีตาราง sessions จะแยกรอบที่ตอบ 4 ข้อแล้วปิดจอ ออกจากรอบที่สอบจบไม่ได้เลย)
SELECT u.display_name,
       SUM(best.score)                          AS got,
       5 * 10                                   AS full,
       ROUND(100.0 * SUM(best.score) / 50.0, 0) AS pct
FROM users u
JOIN LATERAL (
  SELECT s.category, MAX(s.score) AS score
  FROM sessions s
  WHERE s.user_id = u.id AND s.kind = 'quiz' AND s.status = 'done'
  GROUP BY s.category
) best ON true
WHERE u.cohort = 'trial'
GROUP BY u.display_name
ORDER BY got DESC;


-- ────────────────────────────────────────────────────────────────────────────
-- ④ ข้อมูลป้อน pyBKT — รูปแบบที่ไลบรารีต้องการเป๊ะ
-- ────────────────────────────────────────────────────────────────────────────
-- ต้องเรียงตามเวลาต่อ (คน × ทักษะ) เพราะ BKT เป็นโมเดลลำดับ (sequential)
-- :data_until ต้องเป็นค่าเดียวกับที่บันทึกลง bkt_training_runs.data_until ของรอบนั้น
--   ไม่งั้นเล่มจะอ้างไม่ได้ว่าตัวเลขมาจากข้อมูลชุดไหน
SELECT a.user_id,
       sk.code            AS skill,
       a.is_correct::int  AS correct,
       ROW_NUMBER() OVER (PARTITION BY a.user_id, a.skill_id ORDER BY a.answered_at) AS opportunity
FROM attempts a
JOIN skills sk ON sk.id = a.skill_id
WHERE a.event_type = 'graded'          -- ห้ามให้ exposure หลุดเข้าไป = โมเดลเรียนจากข้อมูลขยะ
  AND a.skill_id IS NOT NULL
  AND a.answered_at <= :data_until
ORDER BY a.user_id, a.skill_id, a.answered_at;


-- ────────────────────────────────────────────────────────────────────────────
-- ⑤ ⚠️ สัญญาณเตือนล่วงหน้า — KC ไหนข้อมูลบางเกินไป  [รันทุกวันระหว่างทดลอง]
-- ────────────────────────────────────────────────────────────────────────────
-- BKT ต้องการ "โอกาสตอบ" หลายครั้งต่อทักษะต่อคน (ข้อเสนอ: >=8 · ขั้นต่ำที่ยังพอไหว: 5)
-- ถ้า KC ไหนโผล่ในผลลัพธ์นี้ = กำลังจะได้ AUC ที่ไม่มีความหมายสำหรับทักษะนั้น
-- ⭐ ต้องรันระหว่างทางเท่านั้นถึงจะแก้ทัน (ดัน drill ของ KC นั้นเข้าคิว)
--    ถ้าไปรู้ตอนจบการทดลอง = แก้ไม่ได้แล้ว ต้องเขียนเป็นข้อจำกัดในเล่มอย่างเดียว
WITH opp AS (
  SELECT user_id, skill_id, COUNT(*) AS n
  FROM attempts
  WHERE event_type = 'graded' AND skill_id IS NOT NULL
  GROUP BY user_id, skill_id
)
SELECT sk.code,
       sk.name_th,
       sk.type,
       COUNT(DISTINCT o.user_id)  AS users_with_data,
       COALESCE(MIN(o.n), 0)      AS min_opportunities,
       ROUND(AVG(o.n), 1)         AS avg_opportunities
FROM skills sk
LEFT JOIN opp o ON o.skill_id = sk.id
GROUP BY sk.code, sk.name_th, sk.type
HAVING COALESCE(MIN(o.n), 0) < 5
ORDER BY min_opportunities, sk.code;


-- ────────────────────────────────────────────────────────────────────────────
-- ⑥ ผล ablation — จุดต่างของโปรเจกต์วัดออกมาเป็นตัวเลข (ME-03)
-- ────────────────────────────────────────────────────────────────────────────
-- ได้ 2 แถวเทียบกันตรง ๆ: full กับ no_thai_l1
-- ผลต่างของ auc สองแถวนี้ = คำตอบว่า "คลัง Thai-L1 ช่วยให้โมเดลแม่นขึ้นจริงไหม"
-- split_seed ต้องเท่ากันทั้งสองแถว ไม่งั้นเทียบกันไม่ได้ (คนละ train/test split)
SELECT variant, kc_count, n_users, n_attempts, split_seed, auc, run_at
FROM bkt_training_runs
WHERE data_until = (SELECT MAX(data_until) FROM bkt_training_runs)
ORDER BY variant;


-- ────────────────────────────────────────────────────────────────────────────
-- ⑦ ตรวจสุขภาพข้อมูลก่อนเอาไปวิเคราะห์ — รันก่อนปิดการทดลองเสมอ
-- ────────────────────────────────────────────────────────────────────────────
-- ทุกแถวที่ออกมา = ข้อมูลที่มีปัญหา ต้องอธิบายได้ก่อนเอาตัวเลขไปใส่เล่ม
SELECT 'attempts ที่ไม่ผูก KC (BKT ใช้ไม่ได้)' AS issue, COUNT(*) AS n
FROM attempts WHERE event_type = 'graded' AND skill_id IS NULL
UNION ALL
SELECT 'attempts ที่ไม่ผูกรอบ (ประกอบคะแนนไม่ได้)', COUNT(*)
FROM attempts WHERE session_id IS NULL
UNION ALL
SELECT 'attempts ที่ไม่มี time_spent_ms (ablation ใช้ไม่ได้)', COUNT(*)
FROM attempts WHERE time_spent_ms IS NULL
UNION ALL
SELECT 'รอบที่ค้างสถานะ running เกิน 1 วัน (ควรเป็น abandoned)', COUNT(*)
FROM sessions WHERE status = 'running' AND started_at < now() - interval '1 day'
UNION ALL
SELECT 'ข้อสอบที่ยังไม่อนุมัติแต่ถูกตอบไปแล้ว (ผิด CG-02)', COUNT(*)
FROM attempts a JOIN items i ON i.id = a.item_id WHERE i.status <> 'approved'
UNION ALL
SELECT 'ข้อในชุดวิจัยที่หลุดไปโผล่ในควิซ/ฝึก (ผิดมติ pre=post)', COUNT(*)
FROM attempts a
JOIN form_items fi ON fi.item_id = a.item_id
JOIN exam_forms f  ON f.id = fi.form_id AND f.research_use_only
JOIN sessions s    ON s.id = a.session_id
WHERE s.kind NOT IN ('pretest', 'mock')
UNION ALL
SELECT 'ผู้ใช้ที่ถอนความยินยอมแต่ยังมี PII ค้าง', COUNT(*)
FROM users WHERE anonymized_at IS NOT NULL AND display_name IS NOT NULL;
