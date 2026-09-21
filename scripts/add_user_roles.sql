-- ====================================================
-- Migration: รองรับหลายบทบาทต่อ 1 บัญชี (req: 1 user = 2 roles)
--
-- เพิ่มคอลัมน์ roles TEXT[] เก็บบทบาททั้งหมดของบัญชี
--   - roles[1] คือ "บทบาทหลัก" (primary) — ใช้ หน้าแรก/การแสดงผล
--   - คอลัมน์ role เดิมยังเก็บไว้ = roles[1] (เพื่อ backward compatibility)
--   - ในโค้ดใหม่จะเขียน/อ่านทั้งสองคอลัมน์ให้สอดคล้องกันเสมอ
--
-- วิธีรัน:
--   psql "$DATABASE_URL" -f scripts/add_user_roles.sql
--   หรือรันผ่าน Supabase Dashboard > SQL Editor
-- ====================================================

-- 1) เพิ่มคอลัมน์ roles (text array) ถ้ายังไม่มี
ALTER TABLE hospital_user
  ADD COLUMN IF NOT EXISTS roles TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

-- 2) Backfill บัญชีเดิม: ให้มี roles = [role เดิม]
UPDATE hospital_user
SET roles = ARRAY[role]
WHERE cardinality(roles) = 0;

-- 3) (Optional) บังคับว่า role หลัก ต้องตรงกับ roles[1] เสมอ
--    ใช้ได้เฉพาะที่ไม่มี data ที่ขัดแย้ง — ควรยิงผ่าน UPDATE เองในแอป