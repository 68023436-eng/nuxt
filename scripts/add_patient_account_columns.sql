-- ============================================================
-- Migration: เพิ่มคอลัมน์ username + unique indexes สำหรับบัญชีผู้ป่วย (Patient Account)
--
-- วิธีรัน:
--   psql "$DATABASE_URL" -f scripts/add_patient_account_columns.sql
--   หรือรันผ่าน Supabase Dashboard > SQL Editor
--
-- ผลลัพธ์:
--   - username          : ชื่อผู้ใช้สำหรับ patient login (nullable — staff ไม่มี)
--   - unique index      : username ต้องไม่ซ้ำกัน (เฉพาะแถวที่มีค่า)
--   - unique index      : phone_number ต้องไม่ซ้ำกัน (เฉพาะแถวที่มีค่า)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospital_user' AND column_name = 'username'
  ) THEN
    ALTER TABLE hospital_user ADD COLUMN username VARCHAR(50) DEFAULT NULL;
    RAISE NOTICE 'เพิ่มคอลัมน์ username สำเร็จ';
  ELSE
    RAISE NOTICE 'คอลัมน์ username มีอยู่แล้ว ข้าม';
  END IF;
END $$;

-- unique index บน username (ไวยากรณ์ Postgres: index unique อนุญาตหลาย NULL ได้)
CREATE UNIQUE INDEX IF NOT EXISTS hospital_user_username_key
  ON hospital_user (username)
  WHERE username IS NOT NULL;

-- unique index บน phone_number (หลาย NULL ได้ แต่เลขซ้ำไม่ได้)
CREATE UNIQUE INDEX IF NOT EXISTS hospital_user_phone_number_key
  ON hospital_user (phone_number)
  WHERE phone_number IS NOT NULL;