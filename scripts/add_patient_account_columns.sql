-- ============================================================
-- Migration: เพิ่มคอลัมน์ username + unique indexes สำหรับบัญชีผู้ป่วย (Patient Account)
-- อยู่ในรูปแบบ Stored Procedure (idempotent) เพื่อเรียกซ้ำได้
--   CALL public.ensure_patient_account_columns();
--
-- ผลลัพธ์:
--   - username          : ชื่อผู้ใช้สำหรับ patient login (nullable — staff ไม่มี)
--   - unique index      : username ต้องไม่ซ้ำกัน (เฉพาะแถวที่มีค่า)
--   - unique index      : phone_number ต้องไม่ซ้ำกัน (เฉพาะแถวที่มีค่า)
-- ============================================================

CREATE OR REPLACE PROCEDURE public.ensure_patient_account_columns()
LANGUAGE plpgsql
AS $$
BEGIN
  ALTER TABLE public.hospital_user
    ADD COLUMN IF NOT EXISTS username VARCHAR(50) DEFAULT NULL;

  -- unique index บน username (ไวยากรณ์ Postgres: index unique อนุญาตหลาย NULL ได้)
  CREATE UNIQUE INDEX IF NOT EXISTS hospital_user_username_key
    ON public.hospital_user (username)
    WHERE username IS NOT NULL;

  -- unique index บน phone_number (หลาย NULL ได้ แต่เลขซ้ำไม่ได้)
  CREATE UNIQUE INDEX IF NOT EXISTS hospital_user_phone_number_key
    ON public.hospital_user (phone_number)
    WHERE phone_number IS NOT NULL;
END;
$$;

CALL public.ensure_patient_account_columns();

-- จำกัดสิทธิ์เรียก procedure นี้ (DDL migration) ให้เฉพาะผู้ดูแลฐานข้อมูล
DO $$
BEGIN
  BEGIN
    REVOKE ALL ON PROCEDURE public.ensure_patient_account_columns() FROM PUBLIC;
    GRANT EXECUTE ON PROCEDURE public.ensure_patient_account_columns() TO postgres;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'skip grant hardening: ensure_patient_account_columns';
  END;
END $$;