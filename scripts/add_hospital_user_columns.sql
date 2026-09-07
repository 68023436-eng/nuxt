-- ============================================================
-- Migration: เพิ่มคอลัมน์สำหรับข้อมูลเจ้าหน้าที่ ลงตาราง hospital_user
--
-- วิธีรัน:
--   psql "$DATABASE_URL" -f scripts/add_hospital_user_columns.sql
--   หรือรันผ่าน Supabase Dashboard > SQL Editor
--
-- ผลลัพธ์ (แต่ละคอลัมน์เพิ่มเฉพาะถ้ายังไม่มี):
--   - phone_number   : เบอร์โทรศัพท์ 10 หลัก (nullable)
--   - email          : อีเมล (nullable)
--   - password_hash  : รหัสผ่านที่ hash ไว้ (nullable — ยังไม่ได้ใช้ตอน login เดิม)
--   - is_active      : สถานะเปิด/ปิดบัญชี (boolean, default true)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospital_user' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE hospital_user ADD COLUMN phone_number VARCHAR(10) DEFAULT NULL;
    RAISE NOTICE 'เพิ่มคอลัมน์ phone_number สำเร็จ';
  ELSE
    RAISE NOTICE 'คอลัมน์ phone_number มีอยู่แล้ว ข้าม';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospital_user' AND column_name = 'email'
  ) THEN
    ALTER TABLE hospital_user ADD COLUMN email VARCHAR(255) DEFAULT NULL;
    RAISE NOTICE 'เพิ่มคอลัมน์ email สำเร็จ';
  ELSE
    RAISE NOTICE 'คอลัมน์ email มีอยู่แล้ว ข้าม';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospital_user' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE hospital_user ADD COLUMN password_hash TEXT DEFAULT NULL;
    RAISE NOTICE 'เพิ่มคอลัมน์ password_hash สำเร็จ';
  ELSE
    RAISE NOTICE 'คอลัมน์ password_hash มีอยู่แล้ว ข้าม';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospital_user' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE hospital_user ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    RAISE NOTICE 'เพิ่มคอลัมน์ is_active สำเร็จ';
  ELSE
    RAISE NOTICE 'คอลัมน์ is_active มีอยู่แล้ว ข้าม';
  END IF;
END $$;
